package com.example.loanminiapp.config;

import com.example.loanminiapp.security.CurrentUser;
import com.example.loanminiapp.security.CurrentUserContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskDecorator;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * 异步线程透传当前用户上下文，避免 @Async 场景下 ThreadLocal 丢失。
 */
@Configuration
public class AsyncContextConfig {

    @Bean("taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(16);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("async-");
        executor.setTaskDecorator(currentUserTaskDecorator());
        executor.initialize();
        return executor;
    }

    @Bean
    public TaskDecorator currentUserTaskDecorator() {
        return runnable -> {
            CurrentUser parentUser = CurrentUserContext.get();
            return () -> {
                try {
                    if (parentUser != null) {
                        CurrentUserContext.set(copyCurrentUser(parentUser));
                    }
                    runnable.run();
                } finally {
                    CurrentUserContext.clear();
                }
            };
        };
    }

    private CurrentUser copyCurrentUser(CurrentUser source) {
        CurrentUser target = new CurrentUser();
        target.setUserId(source.getUserId());
        target.setToken(source.getToken());
        target.setRoles(source.getRoles() == null ? null : new java.util.ArrayList<>(source.getRoles()));
        return target;
    }
}

