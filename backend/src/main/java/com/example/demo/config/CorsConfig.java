package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        // 모든 출처 허용 (개발 환경)
        // 프로덕션에서는 특정 도메인만 허용하도록 변경 필요
        config.addAllowedOriginPattern("*");
        
        // 허용할 HTTP 메서드
        config.addAllowedMethod("*");
        
        // 허용할 헤더
        config.addAllowedHeader("*");
        
        // 인증 정보 허용 (모든 출처 허용 시 false로 설정)
        // 특정 도메인만 허용할 경우 true로 변경 가능
        config.setAllowCredentials(false);
        
        source.registerCorsConfiguration("/api/**", config);
        return new CorsFilter(source);
    }
}

