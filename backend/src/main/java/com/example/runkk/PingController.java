package com.example.runkk;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class PingController {

    @Autowired
    private TestRepository testRepository;

    @GetMapping("/api/ping")
    public String ping() {
        return "ok";
    }

    // DB에서 데이터 꺼내오는 새로운 테스트 API
    @GetMapping("/api/test-db")
    public List<TestItem> getTestData() {
        return testRepository.findAll();
    }
}