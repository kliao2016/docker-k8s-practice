const express = require("express");
const bodyParser = require("body-parser");
const { randomBytes } = require("crypto");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const commentsByPostId = {};

app.get("/posts/:id/comments", (req, res) => {
    res.send(commentsByPostId[req.params.id] || []);
});

app.post("/posts/:id/comments", async (req, res) => {
    const commentId = randomBytes(4).toString("hex");
    const { content } = req.body;

    const currentComments = commentsByPostId[req.params.id] || [];
    currentComments.push({
        id: commentId,
        content: content,
        status: "pending",
    });

    commentsByPostId[req.params.id] = currentComments;

    await axios
        .post("http://event-bus-srv:4005/events", {
            type: "CommentCreated",
            data: {
                id: commentId,
                content,
                postId: req.params.id,
                status: "pending",
            },
        })
        .catch((err) => {
            console.log(err.message);
        });

    res.status(201).send(currentComments);
});

app.post("/events", (req, res) => {
    console.log("Event Received:", req.body.type);

    const { type, data } = req.body;

    if (type === "CommentModerated") {
        const { id, postId, status, content } = data;
        const comments = commentsByPostId[postId];
        const comment = comments.find((comment) => comment.id === id);
        comment.status = status;

        axios
            .post("http://event-bus-srv:4005/events", {
                type: "CommentUpdated",
                data: {
                    id,
                    postId,
                    status,
                    content,
                },
            })
            .catch((err) => {
                console.log(err.message);
            });
    }

    res.send({});
});

app.listen(4001, () => {
    console.log("Listening on 4001");
});
