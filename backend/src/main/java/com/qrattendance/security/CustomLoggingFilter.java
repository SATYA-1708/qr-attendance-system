package com.qrattendance.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
public class CustomLoggingFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        System.out.println("[REQUEST-INBOUND] " + req.getMethod() + " " + req.getRequestURI() + " from " + req.getRemoteAddr());
        
        // Log Origin header for CORS debugging
        String origin = req.getHeader("Origin");
        if (origin != null) {
            System.out.println("  > Origin: " + origin);
        }

        chain.doFilter(request, response);
        
        System.out.println("[REQUEST-OUTBOUND] " + req.getMethod() + " " + req.getRequestURI() + " | Status: " + res.getStatus());
    }
}
