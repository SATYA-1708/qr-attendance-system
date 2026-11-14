package com.qrattendance.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
    }

    @Test
    @DisplayName("Should generate valid JWT token containing email subject")
    void testGenerateAndValidateToken() {
        String email = "test.user@university.edu";
        String token = jwtUtil.generateToken(email);

        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertTrue(jwtUtil.validateToken(token));
        assertEquals(email, jwtUtil.extractEmail(token));
    }

    @Test
    @DisplayName("Should reject malformed or tampered token")
    void testRejectInvalidToken() {
        String invalidToken = "invalid.token.signature";
        assertFalse(jwtUtil.validateToken(invalidToken));
    }
}
