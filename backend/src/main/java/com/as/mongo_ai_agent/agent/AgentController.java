package com.as.mongo_ai_agent.agent;

import com.as.mongo_ai_agent.model.Ticket;
import com.as.mongo_ai_agent.repository.TicketRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;
import java.util.List; // <-- Make sure to add this import if not present

@RestController
@CrossOrigin(origins = "*")
public class AgentController {

    private final ChatClient chatClient;
    private final CustomerAgentService customerAgentService;
    private final TicketRepository ticketRepository;

    public AgentController(ChatClient.Builder chatClientBuilder, 
                           CustomerAgentService customerAgentService, 
                           TicketRepository ticketRepository) {
        this.customerAgentService = customerAgentService;
        this.ticketRepository = ticketRepository;
        this.chatClient = chatClientBuilder
                .defaultSystem("You are an advanced Enterprise IT Helpdesk Agent named OpsMind. Analyze system details and write a brief professional support summary.")
                .build();
    }

    // 1. Core Chat Endpoint
    @GetMapping("/api/chat")
    public String chatWithAgent(@RequestParam(value = "message") String message) {
        String dataContext = "";
        String lowerMessage = message.toLowerCase();
        String ticketId = "N/A";
        String priority = "MEDIUM";
        boolean ticketCreated = false;

        if (lowerMessage.contains("c123")) {
            CustomerAgentService.CustomerResponse dbData = customerAgentService.getCustomerDetails("C123");
            dataContext += "\n[CUSTOMER PROFILE]: " + dbData.toString();
        }

        if (lowerMessage.contains("ticket") || lowerMessage.contains("issue") || lowerMessage.contains("broken")) {
            ticketId = "TKT-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();
            priority = lowerMessage.contains("urgent") || lowerMessage.contains("crash") ? "CRITICAL" : "MEDIUM";
            
            Ticket liveTicket = new Ticket(ticketId, "C123", message, priority, "OPEN");
            ticketRepository.save(liveTicket);
            ticketCreated = true;
        }

        try {
            dataContext += ticketCreated ? String.format("\n[DATABASE ACTION]: Ticket %s opened. Priority: %s.", ticketId, priority) : "";
            return chatClient.prompt().user(message + dataContext).call().content();
        } catch (Exception e) {
            if (ticketCreated) {
                return String.format("🔧 [OpsMind Core]: Ticket successfully logged directly into MongoDB.\n\n🎫 Ticket ID: %s\n⚠️ Priority: %s\n📊 Status: OPEN", ticketId, priority);
            } else {
                return "🔧 [OpsMind Core]: System active. Ready to process your IT queries.";
            }
        }
    }

    // 2. NEW ENDPOINT: Fetch all tickets dynamically from MongoDB
    @GetMapping("/api/tickets")
    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    // 3. NEW ENDPOINT: Update Ticket Status (Resolve)
    @GetMapping("/api/tickets/resolve")
    public String resolveTicket(@RequestParam(value = "id") String id) {
        return ticketRepository.findById(id).map(ticket -> {
            ticket.setStatus("RESOLVED");
            ticketRepository.save(ticket);
            return "SUCCESS";
        }).orElse("NOT_FOUND");
    }

    // 4. NEW ENDPOINT: Update Ticket Priority (Escalate)
    @GetMapping("/api/tickets/escalate")
    public String escalateTicket(@RequestParam(value = "id") String id) {
        return ticketRepository.findById(id).map(ticket -> {
            ticket.setPriority("CRITICAL");
            ticketRepository.save(ticket);
            return "SUCCESS";
        }).orElse("NOT_FOUND");
    }
}