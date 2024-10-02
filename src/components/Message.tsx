import { FC, useRef, useState } from "react";
import { FiMoreHorizontal } from "react-icons/fi";
import MessageDropdown from "./MessageDropdown";
import MoreDot from "./MoreDot";

interface MessageProps {
  message: Message;
  isCurrentUser: boolean;
  setMessageToEdit: React.Dispatch<React.SetStateAction<Message | null>>;
}

const Message: FC<MessageProps> = ({ message, isCurrentUser, setMessageToEdit }) => {
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  // Format datetime
  const date = new Date(message?.createdAt);
  let dateFormated;
  if (new Date().getTime() - date.getTime() < 86400000) {
    dateFormated = date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } else {
    dateFormated = date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  }

  return (
    <div
      className={` flex bg-[#F5F5F5] items-end p-1`}
    >
        <img
          src={message.sender?.avatar}
          className="rounded-full w-[40px] h-[40px] mr-[8px]"
          alt="user"
        />
      <div className={`${
        isCurrentUser ? "bg-[#D4F1ED]" : "bg-[#FBFBFB]"
      } dark:bg-neutral-800 dark:text-white dark:bg-neutral-800 dark:text-white w-full p-3 rounded-tr-xl rounded-tl-xl rounded-br-xl flex flex-col`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-base text-primary-800">{message.sender?.username}</span>
            <span className="ml-2 text-base text-gray-500">{dateFormated}</span>
          </div>
          <div className="flex items-center gap-[10px]">
						<MoreDot
							username={message.sender?.username}
							date={dateFormated}
							time={dateFormated}
							content={message.text}
						/>
					</div>
        </div>
        <p className="text-lg mt-2 text-gray-600">{message.text}</p>
      </div>
    </div>
  );
};

export default Message;
