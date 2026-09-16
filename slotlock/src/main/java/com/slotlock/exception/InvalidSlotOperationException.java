package com.slotlock.exception;

public class InvalidSlotOperationException extends RuntimeException {
    public InvalidSlotOperationException(String message) {
        super(message);
    }
}
