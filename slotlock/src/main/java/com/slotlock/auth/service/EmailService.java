
package com.slotlock.auth.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${RESEND_API_KEY}")
    private String apiKey;

    @Value("${RESEND_FROM_EMAIL:onboarding@resend.dev}")
    private String senderEmail;

    public EmailService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    public void sendOtpEmail(String recipientEmail, String otp) {
        try {
            Map<String, Object> payload = Map.of(
                    "from", senderEmail,
                    "to", List.of(recipientEmail),
                    "subject", "SlotLock - Email Verification",
                    "text",
                    "Hello,\n\n"
                            + "Your OTP for SlotLock email verification is: "
                            + otp + "\n\n"
                            + "This OTP is valid for 15 minutes.\n"
                            + "Please do not share this code with anyone.\n\n"
                            + "If you did not request this verification, "
                            + "you can ignore this email.\n\n"
                            + "Regards,\nSlotLock Team"
            );

            String requestBody =
                    objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            );

            if (response.statusCode() < 200
                    || response.statusCode() >= 300) {
                throw new IllegalStateException(
                        "Email provider rejected request. HTTP status: "
                                + response.statusCode()
                );
            }

        } catch (IOException ex) {
            throw new IllegalStateException(
                    "Failed to communicate with email provider.", ex
            );
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(
                    "Email request was interrupted.", ex
            );
        }
    }
}
