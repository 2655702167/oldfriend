package com.elderly.assistant.controller;

import com.elderly.assistant.common.Result;
import com.elderly.assistant.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/bindPhone")
    public Result<Map<String, Object>> bindPhone(@RequestBody Map<String, String> params) {
        String code = params.get("code");
        return userService.bindPhone(code);
    }
}
