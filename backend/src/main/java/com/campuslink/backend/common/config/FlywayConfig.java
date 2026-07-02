package com.campuslink.backend.common.config;

import javax.sql.DataSource;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

    @Bean
    Flyway flyway(DataSource dataSource) {
        return Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .load();
    }

    @Bean
    ApplicationRunner flywayMigrator(Flyway flyway) {
        return args -> {
            log.info("Running Flyway migrations...");
            var result = flyway.migrate();
            log.info("Flyway migrations complete. Applied {} migrations.", result.migrationsExecuted);
        };
    }
}
