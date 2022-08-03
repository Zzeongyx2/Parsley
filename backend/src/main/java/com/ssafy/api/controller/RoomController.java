package com.ssafy.api.controller;

import com.ssafy.api.request.RoomCreatePostReq;
import com.ssafy.api.response.RoomCreatePostRes;
import com.ssafy.api.response.RoomGetRes;
import com.ssafy.api.response.RoomRes;
import com.ssafy.api.response.RoomsGetRes;
import com.ssafy.api.service.RoomService;
import com.ssafy.db.entity.Room;
import io.swagger.annotations.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Api(value = "방 관리 API", tags = {"Room"})
@RestController
@RequestMapping("/room")
public class RoomController {

    @Autowired
    RoomService roomService;

    @GetMapping("/")
    @ApiOperation(value = "방 목록 조회", notes = "방 목록들을 조회한다.")
    @ApiResponses({
            @ApiResponse(code = 201, message = "방 목록 조회 성공"),
            @ApiResponse(code = 500, message = "서버 오류")
    })
    public ResponseEntity<? extends RoomsGetRes> getRooms() {
        List<Room> rooms = roomService.getRooms();

        return ResponseEntity.status(200).body(
                RoomsGetRes.of(200, "Success", rooms)
        );
    }

    @PostMapping("/create")
    @ApiOperation(value = "방 생성", notes = "생성된 방 id 값을 응답한다.")
    @ApiResponses({
            @ApiResponse(code = 201, message = "방 생성 성공"),
            @ApiResponse(code = 500, message = "서버 오류")
    })
    public ResponseEntity<? extends RoomCreatePostRes> create(
            @RequestBody @ApiParam(value = "방 생성 정보", required = true) RoomCreatePostReq roomInfo) {
        // TODO: user 정보 갖고 와서 넘겨주기
        // User hostUserInfo = jwtService.
        Room room = roomService.createRoom(roomInfo);

        return ResponseEntity.status(200).body(
                RoomCreatePostRes.of(200, "Success", room.getId()));
    }

    // TODO: 방 삭제
    // TODO: 방 정보 수정
    // TODO: 방 검색

}