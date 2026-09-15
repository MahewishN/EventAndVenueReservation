package com.slotlock.auth.service;

import com.slotlock.exception.EmailAlreadyExistsException;
import com.slotlock.exception.InvalidRefreshTokenException;
import com.slotlock.security.JwtService;
import com.slotlock.user.dto.AuthResponse;
import com.slotlock.user.dto.LoginRequest;
import com.slotlock.user.dto.RefreshTokenRequest;
import com.slotlock.user.dto.RegisterRequest;
import com.slotlock.user.entity.Role;
import com.slotlock.user.entity.User;
import com.slotlock.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public void register(RegisterRequest request)
    {
        if(userRepository.existsByEmail(request.getEmail()))
        {
            throw new EmailAlreadyExistsException("Email is already registered");
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(encodedPassword)
                .role(Role.USER)
                .active(true)
                .build();

        userRepository.save(user);
    }

    public AuthResponse login(LoginRequest request)
    {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        UserDetails userDetails =
                (UserDetails) authentication.getPrincipal();

        String accessToken = jwtService.generateAccessToken(userDetails);

        String refreshToken = jwtService.generateRefreshToken(userDetails);

        return new AuthResponse(accessToken, refreshToken);
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {

        String refreshToken = request.getRefreshToken();

        try {
            String email = jwtService.extractEmail(refreshToken);

            if (!"REFRESH".equals(jwtService.extractTokenType(refreshToken))) {
                throw new InvalidRefreshTokenException("Invalid refresh token");
            }

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new InvalidRefreshTokenException("Invalid refresh token"));

            UserDetails userDetails =
                    org.springframework.security.core.userdetails.User
                            .withUsername(user.getEmail())
                            .password(user.getPassword())
                            .roles(user.getRole().name())
                            .disabled(!user.getActive())
                            .build();

            if (!jwtService.isTokenValid(refreshToken, userDetails)) {
                throw new InvalidRefreshTokenException("Invalid or expired refresh token");}

            String newAccessToken = jwtService.generateAccessToken(userDetails);

            return new AuthResponse(
                    newAccessToken,
                    refreshToken
            );

        } catch(InvalidRefreshTokenException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new InvalidRefreshTokenException("Invalid or expired refresh token");
        }
    }
}
