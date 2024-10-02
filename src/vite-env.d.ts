/// <reference types="vite/client" />
type User = {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  accessToken: string;
  avatar?: string;
};

type Sender = {
    userId: string;
    username: string;
    avatar: string;
};

type Message = {
    id: string;
    text: string;
    createdAt: Date;
    conversationId: string;
    images: string[];
    isReply: boolean;
    parentMessage: string | null;
    sender: Sender;
};

type SocketMessage = {
    recipientId: string;
    conversationId: string;
    message: Message;
};

type Participant = {
    userId: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string;
};

type LastMessageSent = {
    id: string;
    text: string;
    images: string[];
    createdAt: Date;
};

type Conversation = {
    conversationId: string;
    participant: Participant;
    lastMessageSent?: LastMessageSent | undefined;
    isRead: boolean;
};


type SearchResults = {
  users: User[];
  numFound: number;
};

interface ConversationState {
  recipient: {
    id: string;
    title: string;
    conversationWithSelf: boolean;
  };
}
