"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/lib/auth/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { HaircutRequest, DepositInfo } from "@/types";
import toast from "react-hot-toast";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (token && user) {
      const socketInstance = io(
        process.env.NEXT_PUBLIC_SOCKET_URL || "https://your-barber-backend-9364a99fcf71.herokuapp.com",
        {
          auth: {
            token,
          },
          transports: ['websocket', 'polling'], // Allow fallback to polling
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          timeout: 20000,
        }
      );

      socketInstance.on("connect", () => {
        setIsConnected(true);
        console.log(
          "🔌 Connected to server, user:",
          user?.firstName,
          "role:",
          user?.role
        );
      });

      socketInstance.on("disconnect", () => {
        setIsConnected(false);
        console.log("🔌 Disconnected from server");
      });

      // Handle heartbeat to keep connection alive
      socketInstance.on('ping', () => {
        socketInstance.emit('pong');
      });

      // Handle reconnection
      socketInstance.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
        // Re-emit barber status after reconnection
        if (user.role === 'barber' && user.isOnline && user.location?.coordinates) {
          const location = user.location;
          setTimeout(() => {
            socketInstance.emit('barber:online-status', { isOnline: true });
            if (location) {
              socketInstance.emit('barber:location-update', {
                coordinates: location.coordinates,
                address: location.address,
              });
            }
          }, 1000);
        }
      });

      // Handle visibility change (mobile browser backgrounding)
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && socketInstance.connected) {
          console.log('📱 App returned to foreground, re-establishing connection');
          // Re-emit online status when app comes back to foreground
          if (user.role === 'barber' && user.isOnline && user.location?.coordinates) {
            const location = user.location;
            setTimeout(() => {
              socketInstance.emit('barber:online-status', { isOnline: true });
              if (location) {
                socketInstance.emit('barber:location-update', {
                  coordinates: location.coordinates,
                  address: location.address,
                });
              }
            }, 1000);
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Request notifications
      socketInstance.on("request:new", (request: HaircutRequest) => {
        // Only show notification if user is a barber and this is for them
        if (user?.role === "barber") {
          const customerName =
            (request as any).userId?.firstName || "a customer";
          toast.success(`New booking request from ${customerName}!`, {
            duration: 6000,
            icon: "📅",
          });
          // Invalidate barber requests to show new request immediately
          queryClient.invalidateQueries({ queryKey: ["barber-requests"] });
        }
      });

      socketInstance.on(
        "request:accepted",
        (data: { request: HaircutRequest; deposit?: DepositInfo }) => {
          const { request, deposit } = data;

          console.log("🔔 Acceptance event received:", {
            requestId: request._id,
            userId: request.userId,
            barberId: request.barberId,
            deposit,
            userRole: user?.role,
          });

          if (user?.role === "user") {
            // Show immediate acceptance notification
            toast.success("🎉 Your booking request was accepted!", {
              icon: "✅",
              duration: 8000,
              style: {
                background: "#10B981",
                color: "white",
                fontWeight: "bold",
              },
            });

            // Show payment info if deposit is required
            if (deposit?.depositRequired) {
              const amount =
                deposit.phase === "deposit"
                  ? deposit.depositAmount
                  : deposit.remainderAmount;
              const formattedAmount = (amount / 100).toFixed(2);

              // Delay payment notification slightly so it doesn't overlap
              setTimeout(() => {
                toast.success(
                  `💳 Payment required: $${formattedAmount} ${
                    deposit.phase === "deposit" ? "(deposit)" : "(full amount)"
                  }`,
                  {
                    duration: 10000,
                    icon: "💳",
                    style: {
                      background: "#3B82F6",
                      color: "white",
                    },
                  }
                );
              }, 1000);
            }
          } else if (user?.role === "barber") {
            toast.success("Booking request accepted successfully!", {
              icon: "✅",
              duration: 4000,
            });
          }

          // Invalidate requests queries to refresh the UI for both users and barbers
          console.log(
            "🔄 SocketContext: Invalidating queries after request acceptance"
          );
          queryClient.invalidateQueries({ queryKey: ["my-requests"] });
          queryClient.invalidateQueries({ queryKey: ["barber-requests"] });

          // Also force a refetch to ensure immediate update
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: ["my-requests"] });
            queryClient.refetchQueries({ queryKey: ["barber-requests"] });
          }, 100);
        }
      );

      socketInstance.on("request:declined", (request: HaircutRequest) => {
        if (user?.role === "user") {
          toast.error("Your booking request was declined", {
            icon: "❌",
            duration: 6000,
          });
        } else if (user?.role === "barber") {
          toast.success("Booking request declined", {
            icon: "❌",
            duration: 4000,
          });
        }
        // Invalidate both queries to refresh UI
        console.log(
          "🔄 SocketContext: Invalidating queries after request declined"
        );
        queryClient.invalidateQueries({ queryKey: ["my-requests"] });
        queryClient.invalidateQueries({ queryKey: ["barber-requests"] });

        // Also force a refetch to ensure immediate update
        setTimeout(() => {
          queryClient.refetchQueries({ queryKey: ["my-requests"] });
          queryClient.refetchQueries({ queryKey: ["barber-requests"] });
        }, 100);
      });

      socketInstance.on("request:completed", (data: any) => {
        const request = data.request || data;
        const release = data.release;

        if (release?.released) {
          toast.success(
            `Service completed! Payment of $${(release.amount / 100).toFixed(
              2
            )} released to barber.`
          );
        } else {
          toast.success("Service completed!");
        }

        console.log(
          "🔄 SocketContext: Invalidating queries after request completed"
        );
        queryClient.invalidateQueries({ queryKey: ["my-requests"] });
        queryClient.invalidateQueries({ queryKey: ["barber-requests"] });

        // Also force a refetch to ensure immediate update
        setTimeout(() => {
          queryClient.refetchQueries({ queryKey: ["my-requests"] });
          queryClient.refetchQueries({ queryKey: ["barber-requests"] });
        }, 100);
      });

      socketInstance.on("request:rescheduled", (request: HaircutRequest) => {
        toast("Your appointment was rescheduled");
        console.log(
          "🔄 SocketContext: Invalidating queries after request rescheduled"
        );
        queryClient.invalidateQueries({ queryKey: ["my-requests"] });
        queryClient.invalidateQueries({ queryKey: ["barber-requests"] });

        // Also force a refetch to ensure immediate update
        setTimeout(() => {
          queryClient.refetchQueries({ queryKey: ["my-requests"] });
          queryClient.refetchQueries({ queryKey: ["barber-requests"] });
        }, 100);
      });

      // Notification events
      socketInstance.on(
        "notification:new",
        (data: { notification: any; unreadCount: number }) => {
          const { notification, unreadCount } = data;

          // Update global unread count (you can store this in context or localStorage)
          localStorage.setItem("unreadNotifications", unreadCount.toString());

          // Show personable notification
          toast(notification.message, {
            icon:
              notification.priority === "high"
                ? "🔴"
                : notification.priority === "medium"
                ? "🟡"
                : "🟢",
            duration: notification.priority === "high" ? 8000 : 5000,
          });
        }
      );

      // Unread count updates
      socketInstance.on(
        "notification:unread-count",
        (data: { unreadCount: number }) => {
          localStorage.setItem(
            "unreadNotifications",
            data.unreadCount.toString()
          );
          // You can emit a custom event here to update UI components
          window.dispatchEvent(
            new CustomEvent("unread-count-updated", {
              detail: { unreadCount: data.unreadCount },
            })
          );
        }
      );

      // Listen for request updates (payment status changes)
      socketInstance.on("request:updated", (request: HaircutRequest) => {
        // Refresh request lists to show updated payment status
        queryClient.invalidateQueries({ queryKey: ["my-requests"] });
        queryClient.invalidateQueries({ queryKey: ["barber-requests"] });
      });

      // Chat notifications
      socketInstance.on("new_message", (data: any) => {
        toast(`New message from ${data.message.sender.firstName}`, {
          icon: "💬",
        });
      });

      // Message read confirmations
      socketInstance.on("message_read", (data: any) => {
        // This will be handled by the chat components
        console.log("Message read:", data);
      });

      // User status changes for chat
      socketInstance.on("user_status_change", (data: any) => {
        // Emit custom event for chat components to listen to
        window.dispatchEvent(
          new CustomEvent("user-status-change", {
            detail: { userId: data.userId, isOnline: data.isOnline },
          })
        );
        console.log("User status changed:", data);
      });

      // Barber status change notifications
      socketInstance.on("barber:status-change", (data: any) => {
        console.log("Barber status changed:", data);
        // This will be handled by the dashboard component
      });

      // Barber location update notifications
      socketInstance.on("barber:location-update", (data: any) => {
        console.log("Barber location updated:", data);
        // This will be handled by the dashboard component
      });

      // New barber in area notifications
      socketInstance.on("barber:new-in-area", (data: any) => {
        toast(`New barber available: ${data.barberName}`, {
          icon: "💇‍♂️",
        });
      });

      setSocket(socketInstance);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        socketInstance.disconnect();
      };
    }
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
