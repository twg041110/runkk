package com.example.runkk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RunkkApplication {

    public static void main(String[] args) {
        // 여기도 DemoApplication.class 에서 RunkkApplication.class 로 변경되어야 합니다.
        SpringApplication.run(RunkkApplication.class, args);
    }

}