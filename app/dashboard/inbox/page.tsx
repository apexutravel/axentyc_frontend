"use client";

import { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Tabs, Tab } from "@heroui/tabs";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  Filter,
} from "lucide-react";

const conversations = [
  { id: "1", name: "Maria Garcia", channel: "whatsapp", lastMessage: "Hola, me interesa el plan premium", time: "2 min", unread: 3, avatar: "MG" },
  { id: "2", name: "Carlos Lopez", channel: "instagram", lastMessage: "Necesito info sobre precios", time: "15 min", unread: 1, avatar: "CL" },
  { id: "3", name: "Ana Martinez", channel: "facebook", lastMessage: "Gracias por la info!", time: "1 hr", unread: 0, avatar: "AM" },
  { id: "4", name: "Pedro Sanchez", channel: "whatsapp", lastMessage: "Cuando puedo agendar una demo?", time: "2 hr", unread: 0, avatar: "PS" },
  { id: "5", name: "Laura Torres", channel: "tiktok", lastMessage: "Vi su video y quiero saber mas", time: "3 hr", unread: 0, avatar: "LT" },
  { id: "6", name: "Diego Rivera", channel: "whatsapp", lastMessage: "Perfecto, quedo atento", time: "5 hr", unread: 0, avatar: "DR" },
];

const messages = [
  { id: "1", content: "Hola! Me interesa el plan premium que vi en su pagina", direction: "inbound" as const, time: "10:30 AM" },
  { id: "2", content: "Hola Maria! Gracias por tu interes. El plan premium incluye acceso ilimitado a todas las funcionalidades.", direction: "outbound" as const, time: "10:32 AM" },
  { id: "3", content: "Que funcionalidades incluye exactamente?", direction: "inbound" as const, time: "10:33 AM" },
  { id: "4", content: "Incluye: Inbox omnichannel, CRM completo, Automatizaciones, Integraciones con redes sociales, y soporte prioritario.", direction: "outbound" as const, time: "10:35 AM" },
  { id: "5", content: "Excelente! Y cual es el precio?", direction: "inbound" as const, time: "10:36 AM" },
  { id: "6", content: "Hola, me interesa el plan premium", direction: "inbound" as const, time: "10:40 AM" },
];

const channelColors: Record<string, "success" | "secondary" | "primary" | "danger"> = {
  whatsapp: "success",
  instagram: "secondary",
  facebook: "primary",
  tiktok: "danger",
};

export default function InboxPage() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [messageInput, setMessageInput] = useState("");

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-0 -m-6">
      <div className="w-80 border-r border-divider flex flex-col bg-content1">
        <div className="p-4 border-b border-divider space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Inbox</h2>
            <Button isIconOnly size="sm" variant="light">
              <Filter size={16} />
            </Button>
          </div>
          <Input
            placeholder="Buscar conversaciones..."
            size="sm"
            startContent={<Search className="text-default-400" size={14} />}
          />
          <Tabs fullWidth size="sm" variant="light">
            <Tab key="all" title="Todas" />
            <Tab key="open" title="Abiertas" />
            <Tab key="pending" title="Pendientes" />
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              className={`w-full text-left p-3 flex items-center gap-3 hover:bg-default-100 transition-colors border-b border-divider ${
                selectedConversation.id === conv.id ? "bg-primary/5 border-l-3 border-l-primary" : ""
              }`}
              onClick={() => setSelectedConversation(conv)}
            >
              <Avatar
                className="flex-shrink-0"
                color={channelColors[conv.channel]}
                name={conv.avatar}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{conv.name}</span>
                  <span className="text-xs text-default-400 flex-shrink-0">{conv.time}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-default-400 truncate">{conv.lastMessage}</p>
                  {conv.unread > 0 && (
                    <Chip color="primary" size="sm" variant="solid">
                      {conv.unread}
                    </Chip>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-content1">
        <div className="h-16 border-b border-divider flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Avatar
              color={channelColors[selectedConversation.channel]}
              name={selectedConversation.avatar}
              size="sm"
            />
            <div>
              <p className="text-sm font-semibold">{selectedConversation.name}</p>
              <div className="flex items-center gap-1.5">
                <Chip
                  color={channelColors[selectedConversation.channel]}
                  size="sm"
                  variant="dot"
                >
                  {selectedConversation.channel}
                </Chip>
                <span className="text-xs text-default-400">En l&iacute;nea</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button isIconOnly size="sm" variant="light">
              <Phone size={16} />
            </Button>
            <Button isIconOnly size="sm" variant="light">
              <Video size={16} />
            </Button>
            <Button isIconOnly size="sm" variant="light">
              <MoreVertical size={16} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                initial={{ opacity: 0, y: 10 }}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                    msg.direction === "outbound"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-default-100 rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-xs mt-1 ${
                    msg.direction === "outbound" ? "text-primary-foreground/60" : "text-default-400"
                  }`}>
                    {msg.time}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="border-t border-divider p-4">
          <div className="flex items-center gap-2">
            <Button isIconOnly size="sm" variant="light">
              <Paperclip size={16} />
            </Button>
            <Input
              placeholder="Escribe un mensaje..."
              size="sm"
              value={messageInput}
              onValueChange={setMessageInput}
            />
            <Button color="primary" isIconOnly size="sm">
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
