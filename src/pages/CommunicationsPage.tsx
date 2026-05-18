import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Mail,
  Phone,
  Users,
  Send,
  Search,
  Smartphone,
  Loader2,
  UserCog,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { socket } from "@/lib/socket";
import { getCustomers } from "@/api/customerApi";
import {
  getCustomerCommunications,
  createCustomerCommunication,
  getEmployeeCommunications,
  createEmployeeCommunication,
} from "@/api/communicationApi";
import { getEmployees } from "@/api/employeeApi";

// Helper to get current user with robust ID extraction
const getCurrentUser = () => {
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    const user = JSON.parse(stored);
    const id = user._id || user.id || user.userId || user.uid;
    if (!id) return null;
    return {
      _id: id,
      role: user.role,
      name: user.name,
    };
  } catch {
    return null;
  }
};

const getToken = () => localStorage.getItem("token");

const channelIcon: Record<string, any> = {
  WhatsApp: MessageSquare,
  Email: Mail,
  Call: Phone,
  Meeting: Users,
  SMS: Smartphone,
};

type TabType = "customers" | "employees" | "adminSupport";

interface Contact {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  assignedTo?: string | { _id: string };
}

interface Communication {
  _id: string;
  channel: string;
  direction: string;
  subject?: string;
  message: string;
  byName: string;
  createdAt: string;
}

export default function CommunicationsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("customers");
  const [allCustomers, setAllCustomers] = useState<Contact[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [employees, setEmployees] = useState<Contact[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [adminContact, setAdminContact] = useState<Contact | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState<Communication[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    channel: "WhatsApp",
    direction: "Outbound",
    subject: "",
    message: "",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRoomJoined = useRef(false);
  const currentUser = getCurrentUser();
  const userId = currentUser?._id;
  const isAdminOrManager = currentUser?.role === "Admin" || currentUser?.role === "Operational Manager";

  // Redirect if not authenticated
  useEffect(() => {
    if (!getToken() || !userId) {
      toast.error("Please login to access communications");
      navigate("/login");
    }
  }, [navigate, userId]);

  // Memoized filtered customers (only assigned to user if employee)
  const customers = useMemo(() => {
    return allCustomers.filter((c) => {
      if (isAdminOrManager) return true;
      const assigneeId = typeof c.assignedTo === "object" ? c.assignedTo?._id : c.assignedTo;
      return assigneeId === userId;
    });
  }, [allCustomers, isAdminOrManager, userId]);

  const tabsForRole = isAdminOrManager
    ? [
        { value: "customers" as TabType, label: "Customers", icon: Users },
        { value: "employees" as TabType, label: "Employees", icon: UserCog },
      ]
    : [
        { value: "customers" as TabType, label: "My Customers", icon: Users },
        { value: "adminSupport" as TabType, label: "Admin Support", icon: UserCog },
      ];

  const getContactsForTab = useCallback(() => {
    if (activeTab === "customers") return customers;
    if (activeTab === "employees") return employees;
    if (activeTab === "adminSupport") return adminContact ? [adminContact] : [];
    return [];
  }, [activeTab, customers, employees, adminContact]);

  const contacts = getContactsForTab();
  const selectedContact = contacts.find((c) => c._id === selectedId);
  const filteredContacts = contacts.filter((c) =>
    c?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Data fetching
  const fetchCustomers = useCallback(async () => {
    if (!userId) return;
    try {
      setCustomersLoading(true);
      const data = await getCustomers();
      setAllCustomers(data);
    } catch (error) {
      toast.error("Failed to fetch customers");
    } finally {
      setCustomersLoading(false);
    }
  }, [userId]);

  const fetchEmployees = useCallback(async () => {
    if (!isAdminOrManager || !userId) return;
    try {
      setEmployeesLoading(true);
      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      toast.error("Failed to fetch employees");
    } finally {
      setEmployeesLoading(false);
    }
  }, [isAdminOrManager, userId]);

  const fetchAdminContact = useCallback(async () => {
    if (isAdminOrManager || !userId) return;
    try {
      const data = await getEmployees();
      const admin = data.find((user: any) => user.role === "Admin");
      if (admin) {
        setAdminContact(admin);
      } else {
        toast.error("No admin user found");
      }
    } catch (error) {
      toast.error("Failed to load admin");
    }
  }, [isAdminOrManager, userId]);

  const fetchMessages = useCallback(async () => {
    if (!selectedId || !userId) return;
    let targetId = selectedId;
    if (activeTab === "adminSupport") {
      targetId = userId; // use own ID for admin support
    }
    try {
      setMessagesLoading(true);
      let data;
      if (activeTab === "customers") {
        data = await getCustomerCommunications(targetId);
      } else {
        data = await getEmployeeCommunications(targetId);
      }
      setMessages(data);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (error) {
      toast.error("Failed to load messages");
    } finally {
      setMessagesLoading(false);
    }
  }, [selectedId, activeTab, userId]);

  // Initial load
  useEffect(() => {
    if (!userId) return;
    fetchCustomers();
    if (isAdminOrManager) fetchEmployees();
    else fetchAdminContact();
  }, [userId, fetchCustomers, fetchEmployees, fetchAdminContact, isAdminOrManager]);

  // Auto-select contact when tab changes
  useEffect(() => {
    if (!userId) return;
    if (activeTab === "customers" && customers.length > 0) {
      if (!selectedId || !customers.some(c => c._id === selectedId)) {
        setSelectedId(customers[0]._id);
      }
    } else if (activeTab === "employees" && employees.length > 0) {
      if (!selectedId || !employees.some(e => e._id === selectedId)) {
        setSelectedId(employees[0]._id);
      }
    } else if (activeTab === "adminSupport" && adminContact) {
      if (selectedId !== adminContact._id) {
        setSelectedId(adminContact._id);
      }
    } else {
      setSelectedId("");
    }
    setMessages([]);
  }, [activeTab, customers, employees, adminContact, selectedId, userId]);

  // Fetch messages when selectedId changes
  useEffect(() => {
    if (selectedId && userId) {
      fetchMessages();
    }
  }, [selectedId, fetchMessages, userId]);

  // Socket connection
  useEffect(() => {
    if (!selectedId || !userId) return;

    let room = "";
    if (activeTab === "customers") {
      room = `customer_${selectedId}`;
    } else if (activeTab === "employees") {
      room = `employee_${selectedId}`;
    } else if (activeTab === "adminSupport") {
      room = `employee_${userId}`;
    } else {
      return;
    }

    socket.emit("join_room", room);
    socketRoomJoined.current = true;

    const handleNewMessage = (newMessage: Communication) => {
      let belongs = false;
      if (activeTab === "customers") {
        belongs = (newMessage as any).customerId === selectedId;
      } else if (activeTab === "employees") {
        belongs = (newMessage as any).employeeId === selectedId;
      } else if (activeTab === "adminSupport") {
        belongs = (newMessage as any).employeeId === userId;
      }
      if (belongs) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === newMessage._id);
          return exists ? prev : [...prev, newMessage];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    };

    socket.on("new_communication", handleNewMessage);

    return () => {
      socket.emit("leave_room", room);
      socket.off("new_communication", handleNewMessage);
      socketRoomJoined.current = false;
    };
  }, [selectedId, activeTab, userId]);

  const handleSubmit = async () => {
    if (!selectedId || !userId) {
      toast.error("User not authenticated");
      return;
    }
    if (!form.message.trim()) {
      toast.error("Enter a message");
      return;
    }

    try {
      setSending(true);
      let savedMessage;
      if (activeTab === "customers") {
        savedMessage = await createCustomerCommunication({
          customerId: selectedId,
          channel: form.channel,
          direction: form.direction,
          subject: form.subject,
          message: form.message,
        });
      } else {
        let employeeId;
        if (activeTab === "employees") {
          employeeId = selectedId;
        } else { // adminSupport
          employeeId = userId;
        }
        savedMessage = await createEmployeeCommunication({
          employeeId,
          channel: form.channel,
          direction: form.direction,
          subject: form.subject,
          message: form.message,
        });
      }
      setMessages((prev) => [...prev, savedMessage]);
      setForm({ ...form, subject: "", message: "" });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      toast.success("Message sent");
    } catch (error: any) {
      toast.error(error.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const noAssignedCustomers = !isAdminOrManager && customers.length === 0;
  const loadingContacts = activeTab === "customers" ? customersLoading : employeesLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[calc(100vh-7rem)] space-y-4"
    >
      <div>
        <h1 className="text-3xl font-heading font-bold">Communications</h1>
        <p className="text-muted-foreground">
          {isAdminOrManager
            ? "Real‑time chat with customers and employees"
            : "Chat with your customers or contact admin support"}
        </p>
      </div>

      <Card className="h-full overflow-hidden border bg-card shadow-md">
        <div className="grid h-full grid-cols-1 md:grid-cols-[320px_1fr]">
          {/* Sidebar - Contact list */}
          <aside className="border-r bg-muted/20">
            <div className="p-4 border-b bg-background/50">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as TabType)}
                className="mb-3"
              >
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabsForRole.length}, 1fr)` }}>
                  {tabsForRole.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="gap-1">
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            <div className="h-[calc(100%-113px)] overflow-y-auto">
              {loadingContacts && (
                <div className="p-6 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loadingContacts && activeTab === "customers" && noAssignedCustomers && (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No customers assigned to you.
                </div>
              )}
              {!loadingContacts && filteredContacts.length === 0 && !noAssignedCustomers && (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No results found.
                </div>
              )}
              {filteredContacts.map((contact) => (
                <button
                  key={contact._id}
                  onClick={() => setSelectedId(contact._id)}
                  className={`w-full flex items-center gap-3 p-4 text-left transition-all ${
                    contact._id === selectedId
                      ? "bg-primary/10 border-l-4 border-primary"
                      : "hover:bg-muted/50 border-l-4 border-transparent"
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold flex-shrink-0">
                    {contact.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{contact.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {contact.phone || contact.email || (activeTab === "employees" ? contact.role : "Customer")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Chat area - WhatsApp style */}
          <section className="flex h-full flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
            {selectedContact ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      {selectedContact.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">{selectedContact.name}</h2>
                      <p className="text-xs text-muted-foreground">
                        {messages.length} {messages.length === 1 ? "message" : "messages"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={fetchMessages} title="Refresh messages">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Badge variant="outline" className="ml-1 hidden sm:flex">Live</Badge>
                  </div>
                </div>

                {/* Messages container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {messagesLoading && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {!messagesLoading && messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="font-medium text-muted-foreground">No messages yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Send a message to start the conversation
                      </p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const Icon = channelIcon[msg.channel] || MessageSquare;
                    const isOutbound = msg.direction === "Outbound";
                    const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const date = new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
                    const isToday = new Date(msg.createdAt).toDateString() === new Date().toDateString();
                    const showDate = !isToday;

                    return (
                      <div key={msg._id} className="flex flex-col">
                        {showDate && (
                          <div className="text-center my-2">
                            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                              {date}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[80%] md:max-w-[65%] px-3 py-2 rounded-2xl shadow-sm ${
                              isOutbound
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-white dark:bg-gray-800 text-foreground rounded-bl-md border border-muted"
                            }`}
                          >
                            {/* Sender name for incoming messages */}
                            {!isOutbound && (
                              <div className="text-xs font-semibold text-primary mb-0.5">
                                {msg.byName}
                              </div>
                            )}
                            {/* Channel badge */}
                            <div className="flex items-center gap-1 mb-0.5">
                              <Badge variant={isOutbound ? "secondary" : "outline"} className="text-[10px] px-1 py-0 h-4 gap-0.5">
                                <Icon className="w-2.5 h-2.5" />
                                {msg.channel}
                              </Badge>
                            </div>
                            {/* Subject */}
                            {msg.subject && (
                              <div className="text-sm font-semibold mb-1">{msg.subject}</div>
                            )}
                            {/* Message */}
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                            {/* Timestamp */}
                            <div className={`text-[10px] mt-1 flex justify-end ${
                              isOutbound ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}>
                              {time}
                              {isOutbound && (
                                <span className="ml-1.5">✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="border-t bg-background p-3 space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Channel" />
                      </SelectTrigger>
                      <SelectContent>
                        {["WhatsApp", "Email", "Call", "Meeting", "SMS"].map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v })}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Direction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Outbound">Outbound</SelectItem>
                        <SelectItem value="Inbound">Inbound</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.channel === "Email" && (
                      <Input
                        placeholder="Subject"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="h-9 text-sm"
                      />
                    )}
                  </div>
                  <div className="flex gap-2 items-end">
                    <Textarea
                      rows={2}
                      placeholder="Type a message..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="resize-none text-sm min-h-[60px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                    />
                    <Button onClick={handleSubmit} disabled={sending} className="h-10 px-4 shrink-0">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      <span className="hidden sm:inline ml-2">Send</span>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Users className="h-12 w-12 opacity-30" />
                <p className="text-center">Select a contact to start chatting</p>
              </div>
            )}
          </section>
        </div>
      </Card>
    </motion.div>
  );
}