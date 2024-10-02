import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "./useAxiosPrivate";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export const useGetConversations = () => {
  const axiosPrivate = useAxiosPrivate();
  const { currentUser } = useAuth();
  return useQuery<Conversation[]>(
    ["conversations"],
    async () => {
      const res = await axiosPrivate.get(
        `/linkup/conversations`, {headers: {
          Authorization: `Bearer ${currentUser?.accessToken}`,
        },}
      );
      return res.data.conversations;
    },
    {
      onError: (err) => {
        console.error(err);
      },
      refetchOnWindowFocus: false,
    }
  );
};

export const useNewConversation = (participant: string) => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return useMutation<Conversation>(
    async () => {
      const res = await axiosPrivate.post("/linkup/conversations/new", {
        participant,
      });
      return res.data;
    },
    {
      onSuccess: (data) => {
        const prevConversations = queryClient.getQueryData<Conversation[]>([
          "conversations",
        ]);
        if (!prevConversations?.some((conv) => conv.conversationId === data.conversationId)) {
          queryClient.setQueryData(
            ["conversations"],
            [...prevConversations!, data]
          );
        }
       
        const conversationWithSelf = 
          data.participant.userId === currentUser?.userId;
        const recipient = data.participant;
        const state: ConversationState = {
          recipient: {
            id: recipient.userId,
            title: recipient.firstName,
            conversationWithSelf: recipient.userId === currentUser?.userId,
          },
        };
        navigate(`/${data.conversationId}`, { state });
      },
      onError: (err) => {
        console.log("ERROR", err);
      },
    }
  );
};

export const useReadConversation = () => {
  const axiosPrivate = useAxiosPrivate();

  return useMutation(
    async (conversationId: string) => {
      const res = await axiosPrivate.put(
        `/linkup/conversations/${conversationId}/read`
      );
      return res.data;
    },
    {
      onSuccess: (data) => {
        console.log("SUCCESS", data);
      },
    }
  );
};
