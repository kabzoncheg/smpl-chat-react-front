import React from 'react';
import { Redirect } from 'react-router-dom';
import './LoginPage.css';

let _ = require('lodash');

class LoginPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            f_val: '',
            f_err: '',
            nick: this.props.loginState.nickname
        };
        this.loginState = this.props.loginState;
        this.loginHandler = this.props.handler;
        this.handleApiResponse = this.handleApiResponse.bind(this);
        this.handleChangeForm = this.handleChangeForm.bind(this);
        this.handleSubmitForm = this.handleSubmitForm.bind(this);
    }

    handleApiResponse (json_data) {
        if (json_data.body.nickname){
            this.setState({nick: json_data.body.nickname});
            this.loginHandler(json_data.body.nickname);
        }
    }

    handleChangeForm(event) {
        let val = event.target.value;
        this.setState({f_val: val});
        if (!_.isString(val) || val.match(/[^a-z0-9]/i) || val <30 ) {
            this.setState({f_err: 'Nickname must contain latin characters and numbers,' +
                ' it must be less than 30 characters in length!'});
        } else {
            this.setState({f_err: ''});
        }
    }

    handleSubmitForm(event) {
        if (!this.state.f_err) {
            let nickname = this.state.f_val;
            let requestString = 'http://localhost:1337/user/signup?nickname=' + nickname;
            fetch(requestString, {
                method: 'PUT',
                mode: 'cors',
                credentials: 'include'
            })
                .then(response => response.json())
                .then(json_data => this.handleApiResponse(json_data));
            // TO DO: error handling
        }
        event.preventDefault();
    }

    componentDidMount() {
        // Move this feature to App component to prevent Login page load in case session exist !
        let requestString = 'http://localhost:1337/user/check';
        fetch(requestString, {
            method: 'PUT',
            mode: 'cors',
            credentials: 'include'
        })
            .then(response => response.json())
            .then(json_data => this.handleApiResponse(json_data));
        // TO DO: error handling
    }

    render () {
        if (this.props.loginState.login_state) {
            return <Redirect to="/chat"/>
        }

        return (
            <div className="login">
                <div className="jumbotron">
                    <form onSubmit={this.handleSubmitForm}>
                        <fieldset>
                            <legend>Please enter your Nickname:</legend>
                            <input type={"text"} className="nick_input" onChange={this.handleChangeForm}/>
                        </fieldset>
                        <br/>
                        <button type="submit" value="Login" className="btn btn-success btn-lg">Login</button>
                    </form>
                    <p className="text-danger"> {this.state.f_err} </p>
                </div>
            </div>
        )
    }
}

export default LoginPage;
