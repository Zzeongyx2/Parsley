import axios from "axios";
import { OpenVidu } from "openvidu-browser";
import React, { Component } from "react";
import UserVideoComponent from "../../OpenVidu/UserVideoComponent";
import Button from "../atoms/Button";

const OPENVIDU_SERVER_URL = "https://" + window.location.hostname + ":4443";
const OPENVIDU_SERVER_SECRET = "MY_SECRET";

class StudyRoomOV extends Component {
    constructor(props) {
        super(props);

        this.state = {
            mySessionId: "손꾸락방",
            myUserName: "유교보이" + Math.floor(Math.random() * 100),
            session: undefined,
            mainStreamManager: undefined,
            publisher: undefined,
            subscribers: [],
        };

        this.joinSession = this.joinSession.bind(this);
        this.leaveSession = this.leaveSession.bind(this);
        this.switchCamera = this.switchCamera.bind(this);
        this.handleChangeSessionId = this.handleChangeSessionId.bind(this);
        this.handleChangeUserName = this.handleChangeUserName.bind(this);
        this.handleMainVideoStream = this.handleMainVideoStream.bind(this);
        this.onbeforeunload = this.onbeforeunload.bind(this);
    }

    componentDidMount() {
        window.addEventListener("beforeunload", this.onbeforeunload);
    }

    componentWillUnmount() {
        window.removeEventListener("beforeunload", this.onbeforeunload);
    }

    onbeforeunload(event) {
        this.leaveSession();
    }

    handleChangeSessionId(e) {
        this.setState({
            mySessionId: e.target.value,
        });
    }

    handleChangeUserName(e) {
        this.setState({
            myUserName: e.target.value,
        });
    }

    handleMainVideoStream(stream) {
        if (this.state.mainStreamManager !== stream) {
            this.setState({
                mainStreamManager: stream,
            });
        }
    }

    deleteSubscriber(streamManager) {
        let subscribers = this.state.subscribers;
        let index = subscribers.indexOf(streamManager, 0);
        if (index > -1) {
            subscribers.splice(index, 1);
            this.setState({
                subscribers: subscribers,
            });
        }
    }

    joinSession() {
        // --- 1) Get an OpenVidu object ---

        this.OV = new OpenVidu();

        // --- 2) Init a session ---

        this.setState(
            {
                session: this.OV.initSession(),
            },
            () => {
                var mySession = this.state.session;

                // --- 3) Specify the actions when events take place in the session ---

                // On every new Stream received...
                mySession.on("streamCreated", (event) => {
                    // Subscribe to the Stream to receive it. Second parameter is undefined
                    // so OpenVidu doesn't create an HTML video by its own
                    var subscriber = mySession.subscribe(
                        event.stream,
                        undefined
                    );
                    var subscribers = this.state.subscribers;
                    subscribers.push(subscriber);

                    // Update the state with the new subscribers
                    this.setState({
                        subscribers: subscribers,
                    });
                });

                // On every Stream destroyed...
                mySession.on("streamDestroyed", (event) => {
                    // Remove the stream from 'subscribers' array
                    this.deleteSubscriber(event.stream.streamManager);
                });

                // On every asynchronous exception...
                mySession.on("exception", (exception) => {
                    console.warn(exception);
                });

                // --- 4) Connect to the session with a valid user token ---

                // 'getToken' method is simulating what your server-side should do.
                // 'token' parameter should be retrieved and returned by your own backend
                this.getToken().then((token) => {
                    // First param is the token got from OpenVidu Server. Second param can be retrieved by every user on event
                    // 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
                    mySession
                        .connect(token, { clientData: this.state.myUserName })
                        .then(async () => {
                            var devices = await this.OV.getDevices();
                            var videoDevices = devices.filter(
                                (device) => device.kind === "videoinput"
                            );

                            // --- 5) Get your own camera stream ---

                            // Init a publisher passing undefined as targetElement (we don't want OpenVidu to insert a video
                            // element: we will manage it on our own) and with the desired properties
                            let publisher = this.OV.initPublisher(undefined, {
                                audioSource: undefined, // The source of audio. If undefined default microphone
                                videoSource: videoDevices[0].deviceId, // The source of video. If undefined default webcam
                                publishAudio: true, // Whether you want to start publishing with your audio unmuted or not
                                publishVideo: true, // Whether you want to start publishing with your video enabled or not
                                resolution: "640x480", // The resolution of your video
                                frameRate: 30, // The frame rate of your video
                                insertMode: "APPEND", // How the video is inserted in the target element 'video-container'
                                mirror: false, // Whether to mirror your local video or not
                            });

                            // --- 6) Publish your stream ---

                            mySession.publish(publisher);

                            // Set the main video in the page to display our webcam and store our Publisher
                            this.setState({
                                currentVideoDevice: videoDevices[0],
                                mainStreamManager: publisher,
                                publisher: publisher,
                            });
                        })
                        .catch((error) => {
                            console.log(
                                "There was an error connecting to the session:",
                                error.code,
                                error.message
                            );
                        });
                });
            }
        );
    }

    leaveSession() {
        // --- 7) Leave the session by calling 'disconnect' method over the Session object ---

        const mySession = this.state.session;

        if (mySession) {
            mySession.disconnect();
        }

        // Empty all properties...
        this.OV = null;
        this.setState({
            session: undefined,
            subscribers: [],
            mySessionId: "SessionA",
            myUserName: "Participant" + Math.floor(Math.random() * 100),
            mainStreamManager: undefined,
            publisher: undefined,
        });
    }

    async switchCamera() {
        try {
            const devices = await this.OV.getDevices();
            var videoDevices = devices.filter(
                (device) => device.kind === "videoinput"
            );

            if (videoDevices && videoDevices.length > 1) {
                var newVideoDevice = videoDevices.filter(
                    (device) =>
                        device.deviceId !==
                        this.state.currentVideoDevice.deviceId
                );

                if (newVideoDevice.length > 0) {
                    // Creating a new publisher with specific videoSource
                    // In mobile devices the default and first camera is the front one
                    var newPublisher = this.OV.initPublisher(undefined, {
                        videoSource: newVideoDevice[0].deviceId,
                        publishAudio: true,
                        publishVideo: true,
                        mirror: true,
                    });

                    //newPublisher.once("accessAllowed", () => {
                    await this.state.session.unpublish(
                        this.state.mainStreamManager
                    );

                    await this.state.session.publish(newPublisher);
                    this.setState({
                        currentVideoDevice: newVideoDevice,
                        mainStreamManager: newPublisher,
                        publisher: newPublisher,
                    });
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    render() {
        const mySessionId = this.state.mySessionId;
        const myUserName = this.state.myUserName;

        return (
            <div className="container">
                {/* 스터디룸 입장 전 */}
                {this.state.session === undefined ? (
                    <div id="join">
                        <div id="img-div">
                            <img
                                className="w-80 h-60"
                                src="https://images.unsplash.com/photo-1551772413-6c1b7dc18548?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
                                alt="OpenVidu logo"
                            />
                        </div>
                        <div
                            id="join-dialog"
                            className="jumbotron vertical-center"
                        >
                            <div className="font-semibold text-xl mt-2">
                                파슬리랑 공부할 사람?
                            </div>
                            <form
                                className="form-group"
                                onSubmit={this.joinSession}
                            >
                                <div className="flex my-3">
                                    <label
                                        className="font-semibold mr-3"
                                        htmlFor="userName"
                                    >
                                        Participant:{" "}
                                    </label>
                                    <input
                                        className="form-control input-border rounded-lg"
                                        type="text"
                                        id="userName"
                                        value={myUserName}
                                        onChange={this.handleChangeUserName}
                                        required
                                    />
                                </div>
                                <div className="flex">
                                    <label
                                        className="font-semibold mr-3"
                                        htmlFor="sessionId"
                                    >
                                        Session:{" "}
                                    </label>
                                    <input
                                        className="form-control input-border rounded-lg"
                                        type="text"
                                        id="sessionId"
                                        value={mySessionId}
                                        onChange={this.handleChangeSessionId}
                                        required
                                    />
                                </div>
                                <div className="my-3">
                                    <Button text={"공부하자 :)"} />
                                </div>
                                {/* <p className="text-center">
                  <input
                    className="btn btn-lg btn-success"
                    name="commit"
                    type="submit"
                    value="JOIN"
                  />
                </p> */}
                            </form>
                        </div>
                    </div>
                ) : null}

                {/* 스터디룸 입장 후 */}
                {this.state.session !== undefined ? (
                    <div id="session">
                        <div id="session-header">
                            <h1 id="session-title">{mySessionId}</h1>
                            <button
                                onClick={this.leaveSession}
                                className="float-right mt-5 bg-red-400 px-3 py-2 text-white rounded-lg"
                            >
                                LEAVE SESSION
                            </button>
                            {/* <input
                className="btn btn-large btn-danger"
                type="button"
                id="buttonLeaveSession"
                onClick={this.leaveSession}
                value="Leave session"
              /> */}
                        </div>
                        {/* // TODO: 위에 N명 이상 되면 넘어가는것 구현해야 함 */}
                        {/* 여러명 작게 보이는거 */}
                        <div
                            id="video-container"
                            className="flex col-md-6 relative float-left cursor-pointer"
                        >
                            {this.state.publisher !== undefined ? (
                                <div
                                    className="stream-container col-md-6 col-xs-6"
                                    onClick={() =>
                                        this.handleMainVideoStream(
                                            this.state.publisher
                                        )
                                    }
                                >
                                    <UserVideoComponent
                                        streamManager={this.state.publisher}
                                    />
                                </div>
                            ) : null}
                            {this.state.subscribers.map((sub, i) => (
                                <div
                                    key={i}
                                    className="stream-container col-md-6 col-xs-6"
                                    onClick={() =>
                                        this.handleMainVideoStream(sub)
                                    }
                                >
                                    <UserVideoComponent streamManager={sub} />
                                </div>
                            ))}
                        </div>

                        {/* 메인 화면 보이는 부분 */}
                        {this.state.mainStreamManager !== undefined ? (
                            <div id="main-video" className="">
                                <UserVideoComponent
                                    streamManager={this.state.mainStreamManager}
                                />
                                <button
                                    onClick={this.switchCamera}
                                    className="float-left mt-5 bg-sub1 px-3 py-2 text-white rounded-lg"
                                >
                                    SWITCH CAMERA
                                </button>
                                {/* <input
                  className="btn btn-large btn-success"
                  type="button"
                  id="buttonSwitchCamera"
                  onClick={this.switchCamera}
                  value="Switch Camera"
                /> */}
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        );
    }

    /**
     * --------------------------
     * SERVER-SIDE RESPONSIBILITY
     * --------------------------
     * These methods retrieve the mandatory user token from OpenVidu Server.
     * This behavior MUST BE IN YOUR SERVER-SIDE IN PRODUCTION (by using
     * the API REST, openvidu-java-client or openvidu-node-client):
     *   1) Initialize a Session in OpenVidu Server	(POST /openvidu/api/sessions)
     *   2) Create a Connection in OpenVidu Server (POST /openvidu/api/sessions/<SESSION_ID>/connection)
     *   3) The Connection.token must be consumed in Session.connect() method
     */

    getToken() {
        return this.createSession(this.state.mySessionId).then((sessionId) =>
            this.createToken(sessionId)
        );
    }

    createSession(sessionId) {
        return new Promise((resolve, reject) => {
            var data = JSON.stringify({ customSessionId: sessionId });
            axios
                .post(OPENVIDU_SERVER_URL + "/openvidu/api/sessions", data, {
                    headers: {
                        Authorization:
                            "Basic " +
                            btoa("OPENVIDUAPP:" + OPENVIDU_SERVER_SECRET),
                        "Content-Type": "application/json",
                    },
                })
                .then((response) => {
                    console.log("CREATE SESION", response);
                    resolve(response.data.id);
                })
                .catch((response) => {
                    var error = Object.assign({}, response);
                    if (error?.response?.status === 409) {
                        resolve(sessionId);
                    } else {
                        console.log(error);
                        console.warn(
                            "No connection to OpenVidu Server. This may be a certificate error at " +
                                OPENVIDU_SERVER_URL
                        );
                        if (
                            window.confirm(
                                'No connection to OpenVidu Server. This may be a certificate error at "' +
                                    OPENVIDU_SERVER_URL +
                                    '"\n\nClick OK to navigate and accept it. ' +
                                    'If no certificate warning is shown, then check that your OpenVidu Server is up and running at "' +
                                    OPENVIDU_SERVER_URL +
                                    '"'
                            )
                        ) {
                            window.location.assign(
                                OPENVIDU_SERVER_URL + "/accept-certificate"
                            );
                        }
                    }
                });
        });
    }

    createToken(sessionId) {
        return new Promise((resolve, reject) => {
            var data = {};
            axios
                .post(
                    OPENVIDU_SERVER_URL +
                        "/openvidu/api/sessions/" +
                        sessionId +
                        "/connection",
                    data,
                    {
                        headers: {
                            Authorization:
                                "Basic " +
                                btoa("OPENVIDUAPP:" + OPENVIDU_SERVER_SECRET),
                            "Content-Type": "application/json",
                        },
                    }
                )
                .then((response) => {
                    console.log("TOKEN", response);
                    resolve(response.data.token);
                })
                .catch((error) => reject(error));
        });
    }
}

export default StudyRoomOV;
