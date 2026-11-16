package com.ganum.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.SimpleAsyncTaskExecutor;
import org.springframework.core.task.TaskExecutor;

@Configuration
public class AsyncConfig {

	/** 레포트 생성처럼 AI 를 기다리는 작업용. 가상 스레드 + 동시 실행 상한으로 외부 API 과호출을 막습니다. */
	@Bean
	TaskExecutor aiTaskExecutor() {
		SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("ai-");
		executor.setVirtualThreads(true);
		executor.setConcurrencyLimit(4);
		return executor;
	}
}
