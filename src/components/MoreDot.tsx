import { useEffect, useRef, useState } from "react";
import Dots from "../assets/dots.svg";
import reply from "../assets/reply.svg";
import user from "../assets/user.svg";
import { Copy } from "iconsax-react"; 

type MoreDotProps = {
  username: string; 
  date: string;
  time: string;
  content: string;
  onReplyClick?: () => void; 
};

const MoreDot = ({ username, date, time, content, onReplyClick }: MoreDotProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <img
        src={Dots}
        alt="Dotshorizontal"
        className="w-4 h-4 mr-2 cursor-pointer"
        onClick={toggleMenu}
      />
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute  left-[-160px] ${pinnedPosts} bottom-[30px]  z-10  bg-white shadow-lg rounded-lg text-[15px] w-full"
        >
          <ul className="flex flex-col items-start gap-[25px] p-5 absolute  w-[179px] rounded-[10px] z-10 bg-gray-100 shadow-lg">
            <li>
              <button
                className="flex items-center gap-3"
                onClick={onReplyClick} 
              >
                <img src={reply} alt="reply" className="w-[20px] h-[20px]" />
                <span> Reply </span>
              </button>
            </li>

            <li>
              <button className="flex items-center gap-3">
                <Copy size="18" color="#3f3f3f" variant="TwoTone" />
                <span> Copy </span>
              </button>
            </li>

            <li>
              <button className="flex items-center gap-3">
                <img src={user} alt="copy" className="w-[20px] h-[20px]" />
                <span> View profile </span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default MoreDot;
