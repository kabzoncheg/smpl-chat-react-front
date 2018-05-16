import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Grid  from 'react-bootstrap/lib/Grid';
import Navbar from 'react-bootstrap/lib/Navbar';
import './bootstrap.css';
import ChatPage from "./ChatPage";
import LoginPage from "./LoginPage";


class App extends React.Component {
    constructor() {
        super();
        this.state = {
            login_state: false,
            nickname: '',
        };
    this.loginHandler = this.loginHandler.bind(this);
    this.logoutHandler = this.logoutHandler.bind(this);
    }

    loginHandler(nickname) {
        this.setState({
            login_state: true,
            nickname: nickname,
        });
    }

    logoutHandler() {
        this.setState({
            login_state: false,
            nickname: '',
        });
    }

    render() {
        return (
            <div className="wrapper">
                <Navbar className="navbar navbar-expand-lg navbar-dark bg-primary">
                    <Navbar.Header>
                        <Navbar.Brand>
                            <h1>Cyborg Chat</h1>
                        </Navbar.Brand>
                    </Navbar.Header>
                </Navbar>
                <BrowserRouter>
                    <Grid style={ {minWidth: "960px"} }>
                        <Switch>
                            <Route exact path='/' render={() => (<LoginPage loginState={this.state}
                                                                            handler={this.loginHandler}/>)}/>
                            <Route  exact path='/chat'  render = {() => (<ChatPage loginState={this.state}
                                                                                   handler={this.logoutHandler}/>)}/>
                            {/* TO DO: add 404 route ! */}
                        </Switch>
                    </Grid>
                </BrowserRouter>
            </div>
        );
    }
}

export default App;


