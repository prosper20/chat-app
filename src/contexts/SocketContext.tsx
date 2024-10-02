import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useLocation } from "react-router-dom";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { useReadConversation } from "../hooks/useConversations";

type SocketContextType = {
  socket: Socket;
  onlineUserIds: string[];
};

const SocketContext = createContext<any>(undefined);

export const useSocket = (): SocketContextType => {
  return useContext(SocketContext);
};

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState<Socket>();
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const location = useLocation();
  const queryClient = useQueryClient();
  const pathnameRef = useRef<string>(location.pathname);
  const { mutate: readConversation } = useReadConversation();
  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location]);

  useEffect(() => {
    socket?.on("online-users", (userIds) => {
      setOnlineUserIds(userIds);
    });

    socket?.on("user-connected", (userId) => {
      setOnlineUserIds((prevUserIds) => [...prevUserIds, userId]);
    });

    socket?.on("user-disconnected", (userId) => {
      setOnlineUserIds((prevUserIds) =>
        prevUserIds.filter((id) => id !== userId)
      );
    });

    socket?.on("receive-message", (receivedMessage: SocketMessage) => {
      const {message} = receivedMessage;
      const isViewingConversation =
        pathnameRef.current === `/${message.conversationId}`;

      // Update conversations cache
      queryClient.setQueryData<Conversation[]>(
        ["conversations"],
        (prevConversations) => {
          const conversationIndex = prevConversations!.findIndex(
            (conv) => conv.conversationId === message.conversationId
          );
          const updatedConversation: Conversation = {
            ...prevConversations![conversationIndex],
            lastMessageSent: {
              id: message.id,
              text: message.text,
              images: message.images ? message.images : [],
              createdAt: message.createdAt,
            },
            isRead: isViewingConversation,
          };
          isViewingConversation && readConversation(message.conversationId);
          const updatedConversations = [...prevConversations!];
          updatedConversations[conversationIndex] = updatedConversation;
          return updatedConversations;
        }
      );

      // Update messages cache
      const existingMessages = queryClient.getQueryData<Message[]>([
        "messages",
        message.conversationId,
      ]);
      if (existingMessages) {
        queryClient.setQueryData<InfiniteData<Message[]>>(
          ["messages", message.conversationId],
          (prevData) => {
            const pages = prevData?.pages.map((page) => [...page]) ?? [];
            pages[0].unshift({
              id: message.id,
              text: message.text,
              createdAt: message.createdAt,
              conversationId: message.conversationId,
              images: message.images ? message.images : [],
              isReply: message.isReply,
              parentMessage: message.parentMessage ? message.parentMessage : null,
              sender: message.sender,
            });
            return { ...prevData!, pages };
          }
        );
      }
    });

    return () => {
      socket?.off("user-connected");
      socket?.off("user-disconnected");
    };
  }, [socket]);

  useEffect(() => {
    if (currentUser) {
      const newSocket = io(BASE_URL, {
        query: { id: currentUser.userId },
      });
      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [currentUser]);

  const value = {
    socket,
    onlineUserIds,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
