package com.zjzy.quality.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zjzy.quality.entity.AppRecord;
import com.zjzy.quality.repository.AppRecordRepository;
import com.zjzy.quality.util.ChinaTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AppRecordService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private AppRecordRepository repository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void init() {
        jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS app_record (" +
                        "id BIGINT NOT NULL AUTO_INCREMENT," +
                        "record_type VARCHAR(50) NOT NULL," +
                        "payload MEDIUMTEXT NOT NULL," +
                        "uploader VARCHAR(50) NULL," +
                        "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
                        "PRIMARY KEY (id)," +
                        "INDEX idx_type (record_type)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> list(String recordType) {
        List<AppRecord> rows = repository.findByRecordTypeOrderByIdDesc(recordType);
        List<Map<String, Object>> result = new ArrayList<>();
        for (AppRecord row : rows) {
            result.add(toMap(row));
        }
        return result;
    }

    @Transactional
    public Map<String, Object> create(String recordType, Object payload, String uploader) {
        AppRecord row = new AppRecord();
        row.setRecordType(recordType);
        row.setPayload(writePayload(payload));
        row.setUploader(uploader);
        repository.save(row);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("id", row.getId());
        result.put("data", toMap(row));
        return result;
    }

    @Transactional
    public Map<String, Object> update(Long id, Object payload) {
        AppRecord row = repository.findById(id).orElseThrow(() -> new IllegalArgumentException("记录不存在"));
        row.setPayload(writePayload(payload));
        repository.save(row);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("data", toMap(row));
        return result;
    }

    @Transactional
    public Map<String, Object> delete(Long id) {
        repository.deleteById(id);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        return result;
    }

    private Map<String, Object> toMap(AppRecord row) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", row.getId());
        item.put("recordType", row.getRecordType());
        item.put("payload", readPayload(row.getPayload()));
        item.put("uploader", row.getUploader());
        item.put("createdAt", ChinaTime.format(row.getCreatedAt()));
        return item;
    }

    private String writePayload(Object payload) {
        try {
            if (payload instanceof String) {
                return (String) payload;
            }
            return objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            throw new IllegalArgumentException("无法序列化记录内容");
        }
    }

    private Object readPayload(String payload) {
        if (payload == null || payload.isEmpty()) {
            return new LinkedHashMap<String, Object>();
        }
        try {
            return objectMapper.readValue(payload, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return payload;
        }
    }
}
