package com.campuslink.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest
class DatabaseMigrationTests {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Test
	void flywayCreatesMvpDataTables() {
		List<String> tableNames = jdbcTemplate.queryForList(
				"""
				select lower(table_name)
				from information_schema.tables
				where table_schema = 'PUBLIC'
				""",
				String.class);

		assertThat(tableNames).contains(
				"users",
				"profiles",
				"portfolio_items",
				"projects",
				"applications",
				"proposals");
	}
}
