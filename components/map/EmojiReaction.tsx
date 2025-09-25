"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ThumbsUp, Laugh, Star, MessageCircle } from "lucide-react";

interface EmojiReactionProps {
  id: string;
  position: [number, number];
  reactions: {
    heart: number;
    thumbsUp: number;
    laugh: number;
    star: number;
    message: number;
  };
  onReaction: (reactionType: string) => void;
  isVisible: boolean;
}

const reactionTypes = [
  { key: "heart", icon: Heart, color: "text-red-500", bgColor: "bg-red-100" },
  {
    key: "thumbsUp",
    icon: ThumbsUp,
    color: "text-blue-500",
    bgColor: "bg-blue-100",
  },
  {
    key: "laugh",
    icon: Laugh,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100",
  },
  {
    key: "star",
    icon: Star,
    color: "text-purple-500",
    bgColor: "bg-purple-100",
  },
  {
    key: "message",
    icon: MessageCircle,
    color: "text-green-500",
    bgColor: "bg-green-100",
  },
];

export function EmojiReaction({
  id,
  position,
  reactions,
  onReaction,
  isVisible,
}: EmojiReactionProps) {
  const [showReactions, setShowReactions] = useState(false);

  const handleReaction = (reactionType: string) => {
    onReaction(reactionType);
    setShowReactions(false);
  };

  if (!isVisible) return null;

  return (
    <div className="absolute" style={{ left: position[0], top: position[1] }}>
      {/* Reaction Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowReactions(!showReactions)}
        className="relative z-10 w-12 h-12 bg-white rounded-full shadow-lg border-2 border-gray-200 flex items-center justify-center hover:border-blue-300 transition-colors"
      >
        <span className="text-2xl">💬</span>
      </motion.button>

      {/* Reaction Counts */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-md px-2 py-1 text-xs">
        <div className="flex items-center space-x-1">
          {reactionTypes.map(({ key, icon: Icon, color }) => {
            const count = reactions[key as keyof typeof reactions];
            if (count === 0) return null;

            return (
              <div key={key} className="flex items-center space-x-1">
                <Icon className={`w-3 h-3 ${color}`} />
                <span className="text-gray-600">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reaction Picker */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-xl p-3 border border-gray-200"
          >
            <div className="flex space-x-2">
              {reactionTypes.map(({ key, icon: Icon, color, bgColor }) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.2, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleReaction(key)}
                  className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center hover:shadow-md transition-shadow`}
                >
                  <Icon className={`w-5 h-5 ${color}`} />
                </motion.button>
              ))}
            </div>

            {/* Arrow pointing up */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}






