package com.slotlock;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;


@EnableScheduling
@SpringBootApplication
public class SlotlockApplication {

	public static void main(String[] args) {
		SpringApplication.run(SlotlockApplication.class, args);
	}
}
