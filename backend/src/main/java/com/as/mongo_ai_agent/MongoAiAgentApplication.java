package com.as.mongo_ai_agent;

import com.as.mongo_ai_agent.model.Customer;
import com.as.mongo_ai_agent.repository.CustomerRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class MongoAiAgentApplication {

	public static void main(String[] args) {
        SpringApplication.run(MongoAiAgentApplication.class, args);
    }

    // Automatically runs on startup to seed a mock customer into your MongoDB
    @Bean
    public CommandLineRunner seedDatabase(CustomerRepository repository) {
        return args -> {
            // Check if our test customer already exists, if not, create them
            if (!repository.existsById("C123")) {
                Customer mockCustomer = new Customer(
                    "C123", 
                    "Amirullah", 
                    "amirullah@example.com", 
                    "VIP", 
                    "Active"
                );
                repository.save(mockCustomer);
                System.out.println("--- Mock customer data successfully seeded into MongoDB ---");
            }
        };
    }
}