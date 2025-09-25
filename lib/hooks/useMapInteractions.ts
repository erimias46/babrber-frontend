import { useState, useCallback, useEffect } from "react";
import { useSocket } from "@/lib/socket/SocketContext";

export interface MapReaction {
  id: string;
  locationId: string;
  userId: string;
  reactionType: string;
  emoji: string;
  timestamp: Date;
  position: [number, number];
}

export interface MapInteraction {
  id: string;
  type: "emoji" | "photo" | "checkin" | "review";
  locationId: string;
  userId: string;
  content: string;
  timestamp: Date;
  position: [number, number];
}

export function useMapInteractions() {
  const [reactions, setReactions] = useState<MapReaction[]>([]);
  const [interactions, setInteractions] = useState<MapInteraction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { socket } = useSocket();

  // Add a new reaction
  const addReaction = useCallback(
    async (
      locationId: string,
      reactionType: string,
      emoji: string,
      position: [number, number]
    ) => {
      if (!socket) return;

      setIsLoading(true);

      try {
        const reaction: Omit<MapReaction, "id" | "timestamp"> = {
          locationId,
          userId: "current-user", // This would come from auth context
          reactionType,
          emoji,
          position,
        };

        // Emit to socket for real-time updates
        socket.emit("map:add-reaction", reaction);

        // Optimistically add to local state
        const newReaction: MapReaction = {
          ...reaction,
          id: Date.now().toString(),
          timestamp: new Date(),
        };

        setReactions((prev) => [...prev, newReaction]);

        // You would typically also save to your backend here
        // await api.post('/map/reactions', reaction);
      } catch (error) {
        console.error("Failed to add reaction:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [socket]
  );

  // Add a new interaction (photo, checkin, review)
  const addInteraction = useCallback(
    async (
      type: MapInteraction["type"],
      locationId: string,
      content: string,
      position: [number, number]
    ) => {
      if (!socket) return;

      setIsLoading(true);

      try {
        const interaction: Omit<MapInteraction, "id" | "timestamp"> = {
          type,
          locationId,
          userId: "current-user", // This would come from auth context
          content,
          position,
        };

        // Emit to socket for real-time updates
        socket.emit("map:add-interaction", interaction);

        // Optimistically add to local state
        const newInteraction: MapInteraction = {
          ...interaction,
          id: Date.now().toString(),
          timestamp: new Date(),
        };

        setInteractions((prev) => [...prev, newInteraction]);

        // You would typically also save to your backend here
        // await api.post('/map/interactions', interaction);
      } catch (error) {
        console.error("Failed to add interaction:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [socket]
  );

  // Get reactions for a specific location
  const getLocationReactions = useCallback(
    (locationId: string) => {
      return reactions.filter((reaction) => reaction.locationId === locationId);
    },
    [reactions]
  );

  // Get interactions for a specific location
  const getLocationInteractions = useCallback(
    (locationId: string) => {
      return interactions.filter(
        (interaction) => interaction.locationId === locationId
      );
    },
    [interactions]
  );

  // Get reaction summary for a location
  const getLocationReactionSummary = useCallback(
    (locationId: string) => {
      const locationReactions = getLocationReactions(locationId);

      return locationReactions.reduce(
        (summary, reaction) => {
          const key = reaction.reactionType as keyof typeof summary;
          if (key in summary) {
            summary[key]++;
          }
          return summary;
        },
        {
          heart: 0,
          thumbsUp: 0,
          laugh: 0,
          star: 0,
          message: 0,
        }
      );
    },
    [getLocationReactions]
  );

  // Listen for real-time updates from other users
  useEffect(() => {
    if (!socket) return;

    const handleNewReaction = (reaction: MapReaction) => {
      setReactions((prev) => {
        // Avoid duplicates
        if (prev.find((r) => r.id === reaction.id)) return prev;
        return [...prev, reaction];
      });
    };

    const handleNewInteraction = (interaction: MapInteraction) => {
      setInteractions((prev) => {
        // Avoid duplicates
        if (prev.find((i) => i.id === interaction.id)) return prev;
        return [...prev, interaction];
      });
    };

    const handleReactionRemoved = (reactionId: string) => {
      setReactions((prev) => prev.filter((r) => r.id !== reactionId));
    };

    const handleInteractionRemoved = (interactionId: string) => {
      setInteractions((prev) => prev.filter((i) => i.id !== interactionId));
    };

    socket.on("map:reaction-added", handleNewReaction);
    socket.on("map:interaction-added", handleNewInteraction);
    socket.on("map:reaction-removed", handleReactionRemoved);
    socket.on("map:interaction-removed", handleInteractionRemoved);

    return () => {
      socket.off("map:reaction-added", handleNewReaction);
      socket.off("map:interaction-added", handleNewInteraction);
      socket.off("map:reaction-removed", handleReactionRemoved);
      socket.off("map:interaction-removed", handleInteractionRemoved);
    };
  }, [socket]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // You would typically fetch from your backend here
        // const [reactionsData, interactionsData] = await Promise.all([
        //   api.get('/map/reactions'),
        //   api.get('/map/interactions'),
        // ]);
        // setReactions(reactionsData.data);
        // setInteractions(interactionsData.data);

        // For now, we'll use mock data
        const mockReactions: MapReaction[] = [
          {
            id: "1",
            locationId: "barber-1",
            userId: "user-1",
            reactionType: "heart",
            emoji: "❤️",
            timestamp: new Date(),
            position: [40.7128, -74.006],
          },
          {
            id: "2",
            locationId: "barber-1",
            userId: "user-2",
            reactionType: "thumbsUp",
            emoji: "👍",
            timestamp: new Date(),
            position: [40.7128, -74.006],
          },
        ];

        const mockInteractions: MapInteraction[] = [
          {
            id: "1",
            type: "checkin",
            locationId: "barber-1",
            userId: "user-1",
            content: "Just got a great haircut!",
            timestamp: new Date(),
            position: [40.7128, -74.006],
          },
        ];

        setReactions(mockReactions);
        setInteractions(mockInteractions);
      } catch (error) {
        console.error("Failed to load initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  return {
    reactions,
    interactions,
    isLoading,
    addReaction,
    addInteraction,
    getLocationReactions,
    getLocationInteractions,
    getLocationReactionSummary,
  };
}






