import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import useAxiosPrivate from "./useAxiosPrivate";
import { useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import { useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";

export const useGetMessages = (conversationId: string) => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  return useQuery<Message[]>(
    ["messages", conversationId],
    async () => {
      const res = await axiosPrivate.get("/linkup/messages", {
        params: { conversationId },
      });
      return res.data;
    },
    {
      onError: (err: any) => {
        if (err.response?.status === 401) navigate("/");
      },
      retry: (_, error: any) => {
        return error?.response?.status !== 401;
      },
      refetchOnWindowFocus: false,
    }
  );
};

export const useGetMessagesInfinite = (conversationId: string, limit = 20) => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, setCurrentUser } = useAuth();
  return useInfiniteQuery<Message[]>(
    ["messages", conversationId],
    async ({ pageParam = 1 }) => {
      const res = await axiosPrivate.get("/linkup/messages", {
        params: {
          conversationId,
          page: pageParam,
          limit: limit,
        },
        headers: {
          Authorization: `Bearer ${currentUser?.accessToken}`, // Use new access token
        },
      });
      return res.data.messages;
    },
    {
      onSuccess: () => {
        // Set conversation isRead to true
        queryClient.setQueryData<Conversation[]>(
          ["conversations"],
          (prevConversations) => {
            if (prevConversations) {
              const conversationIndex = prevConversations!.findIndex(
                (conv) => conv.conversationId === conversationId
              );
              const updatedConversation: Conversation = {
                ...prevConversations![conversationIndex],
                isRead: true,
              };
              const updatedConversations = [...prevConversations!];
              updatedConversations[conversationIndex] = updatedConversation;
              return updatedConversations;
            }
            return prevConversations;
          }
        );
      },
      onError: (err: any) => {
        if (err.response?.status === 401) navigate("/");
      },
      retry: (_, error: any) => {
        return error?.response?.status !== 401;
      },
      refetchOnWindowFocus: false,
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.length ? allPages.length + 1 : undefined;
      },
    }
  );
};

export const useNewMessage = (
  conversationId: string,
  recipientId: string,
  text: string
) => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const location = useLocation();
  const pathnameRef = useRef<string>(location.pathname);
  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location]);

  return useMutation<Message>(
    async () => {
      const res = await axiosPrivate.post("/linkup/messages/new", {
        text,
        conversationId: conversationId,
      });
      return res.data;
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData<InfiniteData<Message[]>>(
          ["messages", conversationId],
          (prevData) => {
            const pages = prevData?.pages.map((page) => [...page]) ?? [];
            pages[0].unshift(data);
            return { ...prevData!, pages };
          }
        );
        // Update lastMessageSent
        queryClient.setQueryData<Conversation[]>(
          ["conversations"],
          (prevConversations) => {
            const conversationIndex = prevConversations!.findIndex(
              (conv) => conv.conversationId === conversationId
            );
            const updatedConversation: Conversation = {
              ...prevConversations![conversationIndex],
              lastMessageSent: {
                id: data.id,
                text: data.text,
                images: data.images ? data.images : [],
                createdAt: data.createdAt,
              },
            };
            const updatedConversations = [...prevConversations!];
            updatedConversations[conversationIndex] = updatedConversation;
            return updatedConversations;
          }
        );

        // Send to other user
        const msg: SocketMessage = {
          recipientId,
          conversationId,
          message: data,
        }
        socket.emit("send-message", msg);
      },
      onError: (err) => {
        console.log("ERROR", err);
      },
    }
  );
};

export const useDeleteMessage = (conversationId: string) => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();

  return useMutation(
    async (messageId: string) => {
      const res = await axiosPrivate.delete(`/linkup/messages/${messageId}`);
      return res.data;
    },
    {
      onSuccess: (data) => {
        // Remove message from query
        queryClient.setQueryData<InfiniteData<Message[]>>(
          ["messages", conversationId],
          (prevData) => {
            if (prevData) {
              const updatedPages = prevData!.pages.map((page) =>
                page.filter((message) => message.id !== data.messageId)
              );
              return { ...prevData, pages: updatedPages };
            }
            return prevData;
          }
        );
        // Update lastMessageSent in conversation query
        queryClient.setQueryData<Conversation[]>(
          ["conversations"],
          (prevConversations) => {
            const conversationIndex = prevConversations!.findIndex(
              (conv) => conv.conversationId === conversationId
            );
            if (
              prevConversations![conversationIndex].lastMessageSent!.id ===
              data.messageId
            ) {
              let newLastMessageSent = null;
              const messagesData = queryClient.getQueryData<
                InfiniteData<Message[]>
              >(["messages", conversationId]);
              if (messagesData && messagesData.pages.length > 0) {
                const firstPage = messagesData.pages[0];
                newLastMessageSent = firstPage[0];
              }

              let lastMessageSent;
              if (newLastMessageSent === undefined) {
                lastMessageSent = undefined;
              } else {
                lastMessageSent = {
                  id: newLastMessageSent!.id,
                  text: newLastMessageSent!.text,
                  images: newLastMessageSent?.images ? newLastMessageSent.images : [],
                  createdAt: newLastMessageSent!.createdAt,
                };
              }
              const updatedConversation: Conversation = {
                ...prevConversations![conversationIndex],
                lastMessageSent: lastMessageSent,
              };
              const updatedConversations = [...prevConversations!];
              updatedConversations[conversationIndex] = updatedConversation;

              return updatedConversations;
            }
            return prevConversations;
          }
        );
      },
    }
  );
};

export const useEditMessage = (conversationId: string) => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();

  return useMutation(
    async (data: { messageId: string; text: string }) => {
      const res = await axiosPrivate.put(`/linkup/messages/${data.messageId}`, {
        text: data.text,
      });
      return res.data;
    },
    {
      onSuccess: (data, variables) => {
        // Update message in query
        queryClient.setQueryData<InfiniteData<Message[]>>(
          ["messages", conversationId],
          (prevData) => {
            if (prevData) {
              const updatedPages = prevData.pages.map((page) =>
                page.map((message) => {
                  if (message.id === variables.messageId) {
                    return {
                      ...message,
                      text: variables.text,
                      isEdited: true,
                    };
                  }
                  return message;
                })
              );
              return {
                ...prevData,
                pages: updatedPages,
              };
            }
            return prevData;
          }
        );
        // Update lastMessageSent in conversation query
        queryClient.setQueryData<Conversation[]>(
          ["conversations"],
          (prevConversations) => {
            if (prevConversations) {
              const updatedConversations = prevConversations.map(
                (conversation) => {
                  if (conversation.conversationId === conversationId) {
                    return {
                      ...conversation,
                      lastMessageSent: {
                        ...conversation.lastMessageSent!,
                        text: variables.text,
                      },
                    };
                  }
                  return conversation;
                }
              );
              return updatedConversations;
            }
            return prevConversations;
          }
        );
      },
    }
  );
};
