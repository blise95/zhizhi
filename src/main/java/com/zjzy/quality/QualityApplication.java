package com.zjzy.quality;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 卷包过程质量数智管控一体化平台 - 启动类
 * 访问: http://localhost:8080/zhiliang/
 */
@SpringBootApplication
public class QualityApplication {
    public static void main(String[] args) {
        SpringApplication.run(QualityApplication.class, args);
        System.out.println("========================================");
        System.out.println("  卷包过程质量数智管控一体化平台已启动");
        System.out.println("  请访问: http://localhost:8080/zhiliang/");
        System.out.println("========================================");
    }
}
