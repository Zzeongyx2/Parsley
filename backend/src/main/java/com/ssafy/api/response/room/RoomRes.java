package com.ssafy.api.response.room;

import com.ssafy.db.entity.*;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@ApiModel("RoomResponse")
public class RoomRes {
    @ApiModelProperty(name = "방 ID", example = "123")
    Long id;

    @ApiModelProperty(name = "호스트 정보")
    RoomUserRes hostUser;

    @ApiModelProperty(name = "참가자 목록")
    List<RoomUserRes> members = new ArrayList<>();

    @ApiModelProperty(name = "방 이름", example = "coding_with_me")
    String name;

    @ApiModelProperty(name = "방 커버 이미지 URL", example = "https://images.unsplash.com/photo-1622653533660-a1538fe8424c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80")
    String imageUrl;

    @ApiModelProperty(name = "방 모드", example = "1")
    int mode; // 0: Finger, 1: Face

    @ApiModelProperty(name = "방 설명", example = "Let's gather up and code")
    String description;

    @ApiModelProperty(name = "방 최대 참가 인원 수", example = "4")
    int maxPopulation;

    @ApiModelProperty(name = "공개 여부", example = "1")
    boolean isPublic;

    @ApiModelProperty(name = "해시태그", example = "코딩테스트")
    List<String> hashtags;

    public static RoomRes of(Room room) {
        if(room == null) return null;

        RoomRes res = new RoomRes();
        res.setId(room.getId());
        res.setHostUser(room.getHostUser());
        res.setMembers(room.getMembers());
        res.setName(room.getName());
        res.setImageUrl(room.getImageUrl());
        res.setMode(room.getMode() == Mode.FINGER ? 0 : 1);
        res.setDescription(room.getDescription());
        res.setMaxPopulation(room.getMaxPopulation());
        res.setPublic(room.isPublic());

        List<String> hashtags = new ArrayList<>();
        for(RoomHashtag roomHashtag : room.getRoomHashtags()){
            hashtags.add(roomHashtag.getHashtag().getTag());
        }
        res.setHashtags(hashtags);

        return res;
    }

    public void setHostUser(User hostUser){
        this.hostUser = RoomUserRes.of(hostUser);
    }

    public void setMembers(List<User> members){
        for(User member : members){
            this.members.add(RoomUserRes.of(member));
        }
    }
}