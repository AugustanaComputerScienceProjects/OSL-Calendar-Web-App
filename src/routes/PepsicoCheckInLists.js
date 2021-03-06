import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import React, { Component } from 'react';
import PastEvent from '../components/PastEvent';
import PastEventObj from '../components/PastEventObj';
import firebase from '../config';

//The main runner of the past event page, contains many past events
class PepsicoCheckInLists extends Component {
  listener = null;
  constructor(props) {
    super(props);
    this.state = {
      sortDate1: '2017-05-24',
      sortDate2: '2017-05-22',
      displayedEvents: [],
      filteredEvents: [],
      events: [],
      hidden: 'visible',
      searchText: '',
      mainTitle: 'Pepsico Check-In',
      btnText: 'Sign In',
      signedIn: false,
    };
    this.handleDate1Change = this.handleDate1Change.bind(this);
    this.handleDate2Change = this.handleDate2Change.bind(this);
    this.readPepsicoEvents = this.readPepsicoEvents.bind(this);
    this.createDisplayEvents = this.createDisplayEvents.bind(this);
  }

  componentDidMount() {
    this.readPepsicoEvents();
  }

  componentWillUnmount() {
    this.listener.off();
  }

  componentWillMount() {
    firebase.auth.onAuthStateChanged((user) => {
      if (user) {
        this.setState({ btnText: 'Sign Out', signedIn: true });
        if (!this.state.adminSignedIn && !this.state.leaderSignedIn) {
          this.setState({ userText: user.email + ' (Student)' });
        }
      } else {
        this.setState({ btnText: 'Sign In', signedIn: false, userText: '' });
      }
    });
  }

  //reads in the past events from firebase
  readPepsicoEvents() {
    let self = this;
    this.listener = firebase.database
      .ref('/past-pepsico')
      .orderByChild('startDate');
    this.listener.on('value', function(snapshot) {
      let listEvents = [];
      snapshot.forEach(function(childSnapshot) {
        let webEvent = childSnapshot.val();

        let len = 0;

        if (webEvent.hasOwnProperty('users')) {
          //    webEvent["users"].forEach(function(user){
          //      len++
          // })
          let users = webEvent['users'];
          len = Object.keys(users).length;
        }

        let arr = webEvent['startDate'].split(' ');
        let arr2 = arr[0].split('-');
        // let arr3 = arr[1].split(':');
        let date = arr2[0] + '-' + arr2[1] + '-' + arr2[2];

        let event = new PastEventObj(
          webEvent['name'],
          date,
          len,
          webEvent['users']
        );
        listEvents.push(event);
      });
      self.setState({
        events: listEvents,
        eventsInRange: listEvents,
        filteredEvents: listEvents,
      });
      self.setState({
        sortDate1: listEvents[0].getDate(),
        sortDate2: listEvents[listEvents.length - 1].getDate(),
        hidden: 'hidden',
      });
    });
  }

  //makes an aray of the past events that should be displayed
  async createDisplayEvents(d1, d2) {
    let startInd = this.state.events.length;
    let endInd = -2;

    var moment = require('moment');

    for (let i = 0; i < this.state.events.length; i++) {
      let date = this.state.events[i].getDate();
      if (moment(date).isSameOrAfter(d1)) {
        startInd = i;
        i = this.state.events.length;
      }
    }
    for (let i = startInd; i < this.state.events.length; i++) {
      let date = new Date(this.state.events[i].getDate());
      if (moment(date).isAfter(d2)) {
        endInd = i;
        i = this.state.events.length;
      }
    }

    //if no end was found
    if (endInd === -2) {
      endInd = this.state.events.length;
    }

    let displayedEvents = [];

    for (let i = startInd; i < endInd; i++) {
      displayedEvents.push(this.state.events[i]);
    }

    //this was done to prevent a display bug (threading issues)
    await this.setState({ eventsInRange: [] });
    await this.setState({ eventsInRange: displayedEvents });
    this.filterEvents(this.state.searchText, displayedEvents);
  }

  //changes the date for the first date picker (and updates the display)
  handleDate1Change = (e) => {
    let date = new Date(e);
    var month = (1 + date.getMonth()).toString();
    month = month.length > 1 ? month : '0' + month;
    var day = date.getDate().toString();
    day = day.length > 1 ? day : '0' + day;

    let sortDate1 = date.getFullYear() + '-' + month + '-' + day;

    this.setState({ sortDate1: sortDate1 });
    this.createDisplayEvents(sortDate1, this.state.sortDate2);
  };

  //changes the date for the second date picker (and updates the display)
  handleDate2Change = (e) => {
    let date = new Date(e);
    var month = (1 + date.getMonth()).toString();
    month = month.length > 1 ? month : '0' + month;
    var day = date.getDate().toString();
    day = day.length > 1 ? day : '0' + day;

    let sortDate2 = date.getFullYear() + '-' + month + '-' + day;

    this.setState({ sortDate2: sortDate2 });
    this.createDisplayEvents(this.state.sortDate1, sortDate2);
  };

  //handles the search bar changing
  handleSearchChange = (e) => {
    this.setState({ searchText: e.target.value });
    this.filterEvents(e.target.value, this.state.eventsInRange);
  };

  //clears the search bar
  handleClear = () => {
    this.setState({ searchText: '' });
    this.filterEvents('', this.state.eventsInRange);
  };

  //filters the display based on search results
  async filterEvents(text, originalEvents) {
    var index = 0;
    let filtered = [];
    originalEvents.forEach(function(event) {
      if (event['title'].toLowerCase().includes(text.toLowerCase())) {
        filtered.push(event);
      }
      index = index + 1;
    });
    await this.setState({ filteredEvents: [] });
    await this.setState({ filteredEvents: filtered });
  }

  // Action for signing the user in and signing the user out
  signInAction = () => {
    if (!this.state.signedIn) {
      firebase.signIn();
    } else {
      this.setState({ adminSignedIn: false, leaderSignedIn: false });
      firebase.signOut();
    }
  };

  render() {
    const children = [];
    this.state.filteredEvents.forEach(function(event) {
      children.push(
        <Card style={{ margin: '10px', padding: '4px' }}>
          <PastEvent parentEvent={event} />
        </Card>
      );
    });

    return (
      <div>
        <AppBar position='static'>
          <Toolbar variant='dense'>
            <Grid
              justify='space-between' // Add it here :)
              container
              spacing={24}
            >
              <Grid item>
                <Typography variant='h6' color='inherit'>
                  {this.state.mainTitle}
                </Typography>
              </Grid>
              <Grid item style={{ marginRight: 10, marginTop: 5 }}>
                <Typography variant='h7' color='inherit'>
                  {this.state.userText}
                </Typography>
              </Grid>
            </Grid>
            <Button
              color='inherit'
              onClick={this.signInAction}
              style={{ width: 100 }}
            >
              {this.state.btnText}
            </Button>
          </Toolbar>
        </AppBar>
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            margintop: '-50px',
            marginleft: '-50px',
            width: '100px',
            height: '100px',
          }}
        >
          <CircularProgress
            disableShrink
            style={{ visibility: this.state.hidden }}
          ></CircularProgress>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Paper
              style={{
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                width: 400,
              }}
              elevation={1}
            >
              <SearchIcon style={{ padding: 10 }} />
              <InputBase
                style={{ width: 300 }}
                placeholder='Search Events'
                value={this.state.searchText}
                onChange={this.handleSearchChange}
              />
              <IconButton onClick={this.handleClear}>
                <CloseIcon />
              </IconButton>
            </Paper>
          </div>
        </div>

        <Grid container direction='row' justify='center'>
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <Grid
              container
              direction='row'
              justify='center'
              alignItems='flex-start'
            >
              <Grid item>
                <DatePicker
                  margin='normal'
                  label='Start Date'
                  value={this.state.sortDate1}
                  onChange={this.handleDate1Change}
                  renderInput={(params) => <TextField {...params} />}
                />
              </Grid>

              <Grid item>
                <Typography variant='subtitle1' style={{ padding: '30px' }}>
                  To
                </Typography>
              </Grid>

              <Grid item>
                <DatePicker
                  margin='normal'
                  label='End Date'
                  value={this.state.sortDate2}
                  onChange={this.handleDate2Change}
                  renderInput={(params) => <TextField {...params} />}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>

          {children}
        </Grid>
      </div>
    );
  }
}

export default PepsicoCheckInLists;
