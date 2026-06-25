import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Ticket Types
export interface Message {
  id: string;
  sender: 'Customer' | 'Agent';
  senderName: string;
  text: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: 'Technical' | 'Billing' | 'Account' | 'General';
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved';
  customerName: string;
  customerEmail: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

// In-Memory Database Seeded with Sample Tickets
let tickets: Ticket[] = [
  {
    id: 'TKT-7821',
    title: 'Checkout fails with 500 Internal Server Error',
    description: 'Every time I try to purchase the premium subscription plan, the checkout page loads indefinitely and then shows a 500 Internal Server Error. I tried with two different credit cards.',
    category: 'Billing',
    priority: 'High',
    status: 'In Progress',
    customerName: 'John Doe',
    customerEmail: 'john.doe@example.com',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    messages: [
      {
        id: 'msg-1',
        sender: 'Customer',
        senderName: 'John Doe',
        text: 'Every time I try to purchase the premium subscription plan, the checkout page loads indefinitely and then shows a 500 Internal Server Error. I tried with two different credit cards.',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'msg-2',
        sender: 'Agent',
        senderName: 'Sarah Jenkins',
        text: 'Hello John, I apologize for the inconvenience. Let me look into our billing service logs to see what is causing the checkout failure.',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'msg-3',
        sender: 'Agent',
        senderName: 'Sarah Jenkins',
        text: 'I found a database timeout error in our payment gateway microservice. I am escalating this to our devops team to check the gateway connectivity. I will update you as soon as they report back.',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      }
    ]
  },
  {
    id: 'TKT-9102',
    title: 'How do I upgrade from Team to Enterprise plan?',
    description: 'We currently have 25 members on our Team plan and need to upgrade to the Enterprise plan to access SSO (SAML) integrations. What is the process and the pricing schedule for that?',
    category: 'Account',
    priority: 'Medium',
    status: 'Open',
    customerName: 'Alice Vance',
    customerEmail: 'alice.vance@acme-corp.com',
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(), // 1.5 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    messages: [
      {
        id: 'msg-4',
        sender: 'Customer',
        senderName: 'Alice Vance',
        text: 'We currently have 25 members on our Team plan and need to upgrade to the Enterprise plan to access SSO (SAML) integrations. What is the process and the pricing schedule for that?',
        createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      }
    ]
  },
  {
    id: 'TKT-1249',
    title: 'Broken layout on Mobile Safari (iOS 17)',
    description: 'The navigation header overlaps with the main dashboard container when viewed on Safari under iOS 17. The sidebar toggle button is also partially hidden.',
    category: 'Technical',
    priority: 'Low',
    status: 'Resolved',
    customerName: 'Marcus Aurelius',
    customerEmail: 'marcus@philosophy.org',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(), // 20 hours ago
    messages: [
      {
        id: 'msg-5',
        sender: 'Customer',
        senderName: 'Marcus Aurelius',
        text: 'The navigation header overlaps with the main dashboard container when viewed on Safari under iOS 17. The sidebar toggle button is also partially hidden.',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'msg-6',
        sender: 'Agent',
        senderName: 'David Miller',
        text: 'Hi Marcus! Thanks for reporting this. We identified a Safari-specific CSS flexbox bug and deployed a hotfix to production (v1.4.22) that resolves the overlap.',
        createdAt: new Date(Date.now() - 3600000 * 21).toISOString(),
      },
      {
        id: 'msg-7',
        sender: 'Customer',
        senderName: 'Marcus Aurelius',
        text: 'Confirmed, the mobile layout looks perfect now. Thank you for the quick resolution!',
        createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      }
    ]
  }
];

// Helper to generate custom IDs
const generateTicketId = () => {
  return `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
};

// API Endpoints

// 1. Get all tickets
app.get('/api/tickets', (req: Request, res: Response) => {
  res.json(tickets);
});

// 2. Get single ticket by ID
app.get('/api/tickets/:id', (req: Request, res: Response) => {
  const ticket = tickets.find(t => t.id === req.params.id);
  if (!ticket) {
    return res.status(404).json({ message: 'Ticket not found' });
  }
  res.json(ticket);
});

// 3. Create a new support ticket
app.post('/api/tickets', (req: Request, res: Response) => {
  const { title, description, category, priority, customerName, customerEmail } = req.body;

  if (!title || !description || !category || !priority || !customerName || !customerEmail) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const now = new Date().toISOString();
  const initialMessage: Message = {
    id: `msg-${Math.random().toString(36).substr(2, 9)}`,
    sender: 'Customer',
    senderName: customerName,
    text: description,
    createdAt: now,
  };

  const newTicket: Ticket = {
    id: generateTicketId(),
    title,
    description,
    category,
    priority,
    status: 'Open',
    customerName,
    customerEmail,
    createdAt: now,
    updatedAt: now,
    messages: [initialMessage]
  };

  tickets.unshift(newTicket); // Add to the top of the list
  res.status(201).json(newTicket);
});

// 4. Send message/reply inside a ticket thread
app.post('/api/tickets/:id/messages', (req: Request, res: Response) => {
  const { sender, senderName, text } = req.body;

  if (!sender || !senderName || !text) {
    return res.status(400).json({ message: 'Sender, senderName, and text are required.' });
  }

  const ticketIndex = tickets.findIndex(t => t.id === req.params.id);
  if (ticketIndex === -1) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  const now = new Date().toISOString();
  const newMessage: Message = {
    id: `msg-${Math.random().toString(36).substr(2, 9)}`,
    sender,
    senderName,
    text,
    createdAt: now
  };

  tickets[ticketIndex].messages.push(newMessage);
  tickets[ticketIndex].updatedAt = now;

  // Auto-advance status if agent replies and it is still 'Open'
  if (sender === 'Agent' && tickets[ticketIndex].status === 'Open') {
    tickets[ticketIndex].status = 'In Progress';
  }

  res.status(201).json(tickets[ticketIndex]);
});

// 5. Update ticket status
app.patch('/api/tickets/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  if (!status || !['Open', 'In Progress', 'Resolved'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }

  const ticketIndex = tickets.findIndex(t => t.id === req.params.id);
  if (ticketIndex === -1) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  tickets[ticketIndex].status = status;
  tickets[ticketIndex].updatedAt = new Date().toISOString();

  res.json(tickets[ticketIndex]);
});

// 6. Update ticket priority
app.patch('/api/tickets/:id/priority', (req: Request, res: Response) => {
  const { priority } = req.body;
  if (!priority || !['Low', 'Medium', 'High'].includes(priority)) {
    return res.status(400).json({ message: 'Invalid priority value.' });
  }

  const ticketIndex = tickets.findIndex(t => t.id === req.params.id);
  if (ticketIndex === -1) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  tickets[ticketIndex].priority = priority;
  tickets[ticketIndex].updatedAt = new Date().toISOString();

  res.json(tickets[ticketIndex]);
});

// 7. Delete a ticket
app.delete('/api/tickets/:id', (req: Request, res: Response) => {
  const ticketIndex = tickets.findIndex(t => t.id === req.params.id);
  if (ticketIndex === -1) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  tickets.splice(ticketIndex, 1);
  res.json({ message: `Ticket ${req.params.id} has been deleted successfully.` });
});

// Start Express App
app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`🚀 Customer Support Backend is running at:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`=============================================`);
});