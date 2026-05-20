package com.as.mongo_ai_agent.agent;

import com.as.mongo_ai_agent.model.Customer;
import com.as.mongo_ai_agent.repository.CustomerRepository;
import org.springframework.stereotype.Service;

@Service
public class CustomerAgentService {

    private final CustomerRepository customerRepository;

    public CustomerAgentService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public record CustomerResponse(String name, String email, String tier, String status) {}

    // A straightforward Java method to pull data directly from MongoDB
    public CustomerResponse getCustomerDetails(String customerId) {
        System.out.println("--- Java Backend pulled records directly from MongoDB for ID: " + customerId + " ---");
        return customerRepository.findById(customerId)
            .map(c -> new CustomerResponse(c.getName(), c.getEmail(), c.getTier(), c.getStatus()))
            .orElse(new CustomerResponse("Unknown", "N/A", "N/A", "Customer not found in database"));
    }
}