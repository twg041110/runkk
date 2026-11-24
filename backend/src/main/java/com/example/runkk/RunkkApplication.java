package com.example.runkk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
// 저장소(Repository)를 기능별 파일(CourseRepositories 등) 안에 묶어 두었기 때문에 안쪽 것도 찾도록 켠다
@EnableJpaRepositories(considerNestedRepositories = true)
public class RunkkApplication {

    public static void main(String[] args) {
        SpringApplication.run(RunkkApplication.class, args);
    }

}
