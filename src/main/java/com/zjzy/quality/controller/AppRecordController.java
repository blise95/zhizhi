package com.zjzy.quality.controller;

import com.zjzy.quality.entity.SysUser;
import com.zjzy.quality.service.AppRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/records")
public class AppRecordController {

    @Autowired
    private AppRecordService appRecordService;

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam String type) {
        return appRecordService.list(type);
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        String type = body.get("recordType") == null ? "" : String.valueOf(body.get("recordType"));
        if (type.trim().isEmpty()) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("success", false);
            err.put("message", "缺少 recordType");
            return err;
        }
        String uploader = currentUploader(request);
        if (body.get("uploader") != null && !String.valueOf(body.get("uploader")).trim().isEmpty()) {
            uploader = String.valueOf(body.get("uploader")).trim();
        }
        return appRecordService.create(type.trim(), body.get("payload"), uploader);
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return appRecordService.update(id, body.get("payload"));
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        return appRecordService.delete(id);
    }

    private String currentUploader(HttpServletRequest request) {
        Object user = request.getAttribute("currentUser");
        if (user instanceof SysUser) {
            SysUser sysUser = (SysUser) user;
            if (sysUser.getDisplayName() != null && !sysUser.getDisplayName().isEmpty()) {
                return sysUser.getDisplayName();
            }
            return sysUser.getUsername();
        }
        return "未知用户";
    }
}
