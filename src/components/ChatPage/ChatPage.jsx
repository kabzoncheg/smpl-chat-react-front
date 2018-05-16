import React from 'react';
import { Redirect } from 'react-router-dom';
import './ChatPage.css';


var socketIOClient = require('socket.io-client');
var sailsIOClient = require('sails.io.js');
var io = sailsIOClient(socketIOClient);
io.sails.url = 'http://localhost:1337';

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & (0x3 | 0x8));
        return v.toString(16);
    });
}

function Usr(props) {
    const style = [
        "card border-primary mb-3",
        "card border-success mb-3",
        "card border-danger mb-3",
        "card border-warning mb-3",
        "card border-info mb-3",
        "card border-light mb-3"
    ];
    return (
        <div className="usr_names">
            <div className={ style[props.style_num] }>
                <p className="card-text">{props.name}</p>
            </div>
        </div>
    );
}

function Msg(props) {
    return (
        <tr>
            <td style={ {width: "20%"} }><p className="text-info">{ props.msg.usr }</p></td>
            <td style={ {width: "70%"} }><p className="text-primary">{ props.msg.msg }</p></td>
            <td><p className="text-muted">{ props.msg.time.toLocaleTimeString() }</p></td>
        </tr>
    );
}


class UsrTab extends React.Component{
    renderUser(name, style, index) {
        return (
            <Usr key={index}
                name={name}
                style_num={style}
            />
        );
    }

    createUsers(){
        let user_table = [];
        let users = this.props.users;
        for(let i = 0; i < users.length; i++) {
            user_table.push(this.renderUser(users[i], i%5, i));
        }
        return user_table;
    }

    render() {
        return (
            <div className="jumbotron">
                <div className="usr_list">
                    {this.createUsers()}
                </div>
            </div>
        );
    }
}


class ChatTab extends React.Component{
    renderMessage(msg, index){
        return(
            <Msg key={index}
                msg = {msg}
            />
        );
    }

    createMessages() {
        let msg_table = [];
        let history = this.props.history;
        for(let i = 0; i < history.length; i++) {
            msg_table.push(this.renderMessage(history[i], i));
        }
        return msg_table;
    }

    render(){
        return (
            <div className="jumbotron">
                <div className="msg_list">
                    <table className="table table-hover">
                        <tbody>
                        {this.createMessages()}
                        </tbody>
                    </table>

                </div>
            </div>
        );
    }
}


class ChatPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            msg: '',
            history: [],
            usr_list: [],
            tmp_usr_list: [],
            f1_val: '',
        };
        this.loginState = this.props.loginState;
        this.logoutHandler = this.props.handler;
        this.handleChangeChatInput = this.handleChangeChatInput.bind(this);
        this.handleSubmitChatInput = this.handleSubmitChatInput.bind(this);
        this.handleWSMessage = this.handleWSMessage.bind(this);
        this.sendWSKeepAlive = this.sendWSKeepAlive.bind(this);
        this.clearInactiveUsers = this.clearInactiveUsers.bind(this);
        this.handleWSKeepAlive = this.handleWSKeepAlive.bind(this);
        this.handleMessagePreload = this.handleMessagePreload.bind(this);
    }

    handleChangeChatInput(event) {
        this.setState({[event.target.name]: event.target.value});
    }

    handleSubmitChatInput(event) {
        const guid = uuidv4();
        io.socket.put('/chat/chat', {
                message: this.state.msg,
                sender: this.loginState.nickname,
                guid: guid
            },
            function(data, JWR){
            if (JWR.statusCode !== 200) {
                console.error(JWR);
                // TO DO: error checking
            }
        });

        event.preventDefault();
    }

    handleWSMessage(msg) {
        const new_history = this.state.history;
        const time = new Date();
        new_history.push({
                usr: msg.sender,
                msg: msg.message,
                time: time,
                id: msg.guid
            }
        );
        this.setState({history: new_history});
    }

    sendWSKeepAlive() {
        io.socket.post('/chat/keepalive', {sender: this.loginState.nickname},
            function(data, JWR){
                if (JWR.statusCode !== 200) {
                    console.error(JWR);
                    // TO DO: error checking
                }
            });
    }

    clearInactiveUsers() {
        this.setState({usr_list: this.state.tmp_usr_list, tmp_usr_list: []});
    }

    handleWSKeepAlive(msg) {
        const tmp_usr_list = this.state.tmp_usr_list;
        if (!tmp_usr_list.includes(msg.sender)) {
            tmp_usr_list.push(msg.sender);
        }
        this.setState({tmp_usr_list: tmp_usr_list});
    }

    handleMessagePreload(json_data){
        // console.log(json_data.body);
        // ADD history sorting and consistency checking!
        // TODO: fix bug here
        var new_history = this.state.history;
        if (json_data.body.messages) {
            var messages = json_data.body.messages;
            for (let msg = 0; msg < messages.length; msg++) {
                new_history.push({
                        usr: msg.sender,
                        msg: msg.message,
                        time: new Date(msg.createdAt),
                        id: msg.guid
                    }
                );
                this.setState({history: new_history});
            }
        }
    }

    componentDidMount() {
        this.sendWSKeepAlive_interval = setInterval(this.sendWSKeepAlive, 1000);
        this.clearInactiveUsers_interval = setInterval(this.clearInactiveUsers, 3000);
        this.setState({usr_list: [this.loginState.nickname]});

        // TO DO Move API call to dedicated function for reuse (on scroll event, for example)
        let requestString = 'http://localhost:1337/chat/populate?offset=100';
        fetch(requestString, {
            method: 'GET',
            mode: 'cors',
            credentials: 'include'
        })
            .then(response => response.json())
            .then(json_data => this.handleMessagePreload(json_data));
        // TO DO: error handling

        if (this.loginState.login_state) {
            io.socket.put('/chat/join', function (data, JWR) {
                if (JWR.statusCode !== 200) {
                    console.error(JWR);
                    // TO DO: error checking
                }
            });

            io.socket.on('message',  (msg) => {
                this.handleWSMessage(msg);
            });

            io.socket.on('keepalive',  (msg) => {
                this.handleWSKeepAlive(msg);
            });
        }
    }

    componentWillUnmount() {
        clearInterval(this.sendWSKeepAlive_interval);
        clearInterval(this.clearInactiveUsers_interval);
    }

    render () {
        if (!this.props.loginState.login_state) {
            return <Redirect to="/"/>
        }

        return (
            <div className="chat">
                <div className="row">
                    <div className="column left">
                        <UsrTab
                            users={this.state.usr_list}
                        />
                    </div>
                    <div className="column right">
                        <ChatTab
                            history={this.state.history}
                        />
                        <form onSubmit={this.handleSubmitChatInput} >
                            <label>
                                <input className="chat_input"
                                    name="msg"
                                    type="text"
                                    value={this.state.msg}
                                    onChange={this.handleChangeChatInput}
                                />
                            </label>
                            <button type="submit" value="Login" className="btn btn-success">SEND</button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

export default ChatPage;
