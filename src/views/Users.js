import Button from '@mui/material/Button';
import DialogContentText from '@mui/material/DialogContentText';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import React, { Component } from 'react';
import CSVReader from 'react-csv-reader';
import Select from 'react-select';

import firebase from '../config';
import DispatchGroup from '../components/DispatchGroup';

// File for the Users page

class Users extends Component {
  group = new DispatchGroup();

  state = {
    admins: [],
    leaders: [],
    email: '',
    organization: '',
    groups: [],
    adding: false,
    ref: '',
    type: '',
    deleting: false,
    hidden: 'visible',
    disabled: false,
    uploading: false,
    demographicsFile: null,
    groupLeaders: new Map(),
    groupsForLeaders: [],
    leadersForGroups: [],
    groupLeaderRemoved: '', 
  };

  listeners = [];

  // Handles the changing of the email in the add admin/leader screen
  handleEmailChange = (event) => {
    this.setState({ email: event.target.value });
  };

  // Action for removing a given user - opens the confirm option
  removeAction = (ref, user, name) => {
    this.setState({ email: user, ref: ref, groupLeaderRemoved: name });
    this.handleDeleteOpen();
  };

  // Deletes the user from the database once they hit the confirm button
  deleteUser = () => {
    let user = this.state.email.replace('.', ',');
    if (this.state.ref === '/leaders/') {
      let org = this.codeGroup(this.state.groupLeaderRemoved);
      console.log('Leader group: ' + org);
      firebase.database
        .ref('/groups-to-leaders/' + org + '/leaders/' + user)
        .remove();
      firebase.database.ref('/leaders/' + user + '/groups/' + org).remove();
    } else {
      firebase.database.ref(this.state.ref + user).remove();
    }
    this.handleDeleteClose();
  };

  // Handles closing of the add user pop up
  handleClose = () => {
    this.setState({ adding: false });
  };

  // Handles opening of the add user pop up
  handleOpen = () => {
    this.setState({ adding: true });
  };

  // Handles closing of the confirm pop up for deleting a user
  handleDeleteClose = () => {
    this.setState({ deleting: false });
  };

  // Handles opening of the confrim pop up for deleting a user
  handleDeleteOpen = () => {
    this.setState({ deleting: true });
  };

  handleCloseUpload = () => {
    this.setState({ uploading: false });
  };

  // Handles opening of the add user screen
  addAction = (ref, type) => {
    this.setState({ email: '', ref: ref, type: type });
    if (type === 'Administrator') {
      this.setState({ disabled: true });
    } else {
      this.setState({ disabled: false });
    }

    this.handleOpen();
  };

  uploadAction = () => {
    this.setState({ uploading: true });
  };

  uploadLeaders = () => {
    let leadersCSVData = this.state.demographicsFile;
    if (leadersCSVData === null) {
      alert('Please select a file to upload.');
    } else {
      let columnNames = leadersCSVData[0]; // first row has column names
      firebase.database.ref('/leaders').remove();
      firebase.database.ref('/groups-to-leaders').remove();
      firebase.database.ref('/groups').remove();
      for (let row = 1; row < leadersCSVData.length; row++) {
        let group = leadersCSVData[row][0];
        console.log(group);
        firebase.database.ref('/groups').push(group);
        let codedGroup = this.codeGroup(group);
        console.log(codedGroup);
        if (leadersCSVData[row][1] !== '') {
          for (let column = 1; column < columnNames.length; column++) {
            if (leadersCSVData[row][column] === '') {
              break;
            }
            console.log(codedGroup + ': ' + leadersCSVData[row][column]);
            console.log([row][1]);
            firebase.database
              .ref('/groups-to-leaders')
              .child(codedGroup)
              .child('leaders')
              .child(leadersCSVData[row][column].replace('.', ','))
              .set(true);
            firebase.database
              .ref('/leaders')
              .child(leadersCSVData[row][column].replace('.', ','))
              .child('groups')
              .child(codedGroup)
              .set(true);
          }
        } else {
          if (codedGroup === '') {
            break;
          }
          firebase.database
            .ref('/groups-to-leaders')
            .child(codedGroup)
            .child('leaders')
            .child('None')
            .set(true);
        }
      }
      this.setState({ demographicsFile: null, uploading: false });
    }
  };

  // Handles adding of the user once the add user button is clicked
  handleSave = () => {
    if (
      (this.state.organization === '' && this.state.ref === '/leaders/') ||
      this.state.email === ''
    ) {
      alert('Please fill out all fields.');
    } else {
      if (this.state.ref === '/leaders/') {
        let codedGroup = this.codeGroup(this.state.organization);
        firebase.database
          .ref('/groups-to-leaders')
          .child(codedGroup)
          .child('leaders')
          .child('None')
          .remove();
        firebase.database
          .ref(this.state.ref + this.state.email.replace('.', ','))
          .child('groups')
          .child(codedGroup)
          .set(true);
        firebase.database
          .ref('/groups-to-leaders/' + codedGroup)
          .child('leaders')
          .child(this.state.email.replace('.', ','))
          .set(true);
        this.setState({ organization: '' });
      } else {
        firebase.database
          .ref(this.state.ref + this.state.email.replace('.', ','))
          .set(true);
      }
      this.handleClose();
    }
  };

  // Reads the current administrators from the database
  readAdministrators() {
    let token = this.group.enter();
    let self = this;
    let ref = firebase.database.ref('/admin');
    this.listeners.push(ref);
    ref.on('value', function(snapshot) {
      console.log('reading admin');
      let admins = [];
      snapshot.forEach(function(child) {
        admins.push(child.key.replace(',', '.'));
      });
      self.setState({ admins: admins });
      self.group.leave(token);
    });
  }

  // Reads the current leaders from the database
  readLeaders() {
    let token = this.group.enter();
    let self = this;
    let ref = firebase.database.ref('/leaders');
    this.listeners.push(ref);
    ref.on('value', function(snapshot) {
      let leaders = [];
      snapshot.forEach(function(child) {
        leaders.push(child.key.replace(',', '.'));
      });
      self.setState({ leaders: leaders });
      self.group.leave(token);
    });
  }

  // Reads the groups from Firebase and sets the groups list
  readGroups() {
    let self = this;
    let ref = firebase.database.ref('/groups').orderByValue();
    this.listeners.push(ref);
    ref.on('value', function(snapshot) {
      let groupsList = [];
      snapshot.forEach(function(child) {
        let decodedGroup = self.decodeGroup(child);
        groupsList.push(decodedGroup.val());
      });
      self.setState({ groups: groupsList });
      console.log(groupsList);
    });
  }

  codeGroup = (uncodedGroup) => {
    let group = uncodedGroup;
    if (typeof group === 'string' || group instanceof String) {
      console.log('AHHHHHHH: ' + group);
      while (group.includes('.')) {
        group = group.replace('.', '*%&');
      }
      while (group.includes('$')) {
        group = group.replace('$', '@%*');
      }
      while (group.includes('[')) {
        group = group.replace('[', '*&@');
      }
      while (group.includes(']')) {
        group = group.replace(']', '<@+');
      }
      while (group.includes('#')) {
        group = group.replace('#', '!*>');
      }
      while (group.includes('/')) {
        group = group.replace('/', '!<^');
      }
    }
    console.log('CODED GROUP: ' + group);
    return group;
  };

  decodeGroup = (codedGroup) => {
    let group = codedGroup;
    if (typeof group === 'string' || group instanceof String) {
      while (group.includes('*%&')) {
        group = group.replace('*%&', '.');
      }
      while (group.includes('@%*')) {
        group = group.replace('@%*', '$');
      }
      while (group.includes('*<=')) {
        group = group.replace('*<=', '[');
      }
      while (group.includes('<@+')) {
        group = group.replace('<@+', ']');
      }
      while (group.includes('!*>')) {
        group = group.replace('!*>', '#');
      }
      while (group.includes('!<^')) {
        group = group.replace('!<^', '/');
      }
    }
    return group;
  };

  readGroupsWithLeaders() {
    let self = this;
    let ref = firebase.database.ref('/groups-to-leaders');
    this.listeners.push(ref);
    ref.on('value', function(snapshot) {
      if (!snapshot.exists()) {
        self.setState({ groupLeaders: new Map() });
      }
      let groups = new Map();
      snapshot.forEach(function(child) {
        let leaders = [];
        let decodedGroup = self.decodeGroup(child.key);
        child.child('leaders').forEach(function(leader) {
          leaders.push(leader.key.replace(',', '.'));
        });
        groups.set(decodedGroup, leaders);
        self.setState({ groupLeaders: groups });
      });
      console.log('Map: ' + self.state.groupLeaders);
    });
  }

  // Component will mount - read the administrators and leaders, then hide the progress indicator
  componentWillMount() {
    this.readAdministrators();
    this.readLeaders();
    this.readGroups();
    this.readGroupsWithLeaders();
    let self = this;
    this.group.notify(function() {
      self.setState({ hidden: 'hidden' });
    });
  }

  // Compone will unmount - turn off the Firebase listeners
  componentWillUnmount() {
    this.listeners.forEach(function(listener) {
      listener.off();
    });
  }

  //Gives the group selector if the adding a leader
  //Otherwise, leaves it blank
  addGroupSelect() {
    if (this.state.type === 'Leader') {
      const { selectedOption } = this.state.organization;
      return (
        <Grid item>
          <FormControl margin='normal' disabled={this.state.disabled}>
            <InputLabel>Group</InputLabel>
            <div style={{ width: 500 }}>
              <Select
                value={selectedOption}
                onChange={(e) => this.setState({ organization: e.value })}
                options={this.state.groups.map((group) => {
                  return { value: group, label: group };
                })}
              />
            </div>
          </FormControl>
        </Grid>
      );
    }
  }

  handleFileChanged = (data) => {
    console.log(data);
    console.log(data[0]);
    this.setState({ demographicsFile: data });
    console.log(this.state.demographicsFile.length);
  };

  // Render the page
  render() {
    const adminChildren = [];
    const leaderChildren = [];

    // Build the administrator components to display
    for (var i = 0; i < this.state.admins.length; i += 1) {
      let index = i;
      adminChildren.push(
        <ChildComponent
          key={index}
          email={this.state.admins[index]}
          removeAction={() =>
            this.removeAction('/admin/', this.state.admins[index], '')
          }
        ></ChildComponent>
      );
    }

    // Build the leader components to display
    let index = 0;
    if (this.state.groupLeaders.size > 0) {
      for (var [name, value] of this.state.groupLeaders.entries()) {
        leaderChildren.push(
          <GroupTitleComponent group={name}></GroupTitleComponent>
        );
        for (var j = 0; j < value.length; j += 1) {
          let email = value[j];
          let org = name;
          leaderChildren.push(
            <ChildComponent
              key={index}
              email={email}
              removeAction={() => this.removeAction('/leaders/', email, org)}
            ></ChildComponent>
          );
          index++;
        }
      }
    }

    return (
      <div>
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
        <Grid container>
          <Grid item container direction='row'>
            <Grid item style={{ width: '50%' }}>
              <Paper style={{ padding: 20, marginRight: 20 }}>
                <AdminParentComponent
                  title={'Administrators:'}
                  addAction={() => this.addAction('/admin/', 'Administrator')}
                >
                  {adminChildren}
                </AdminParentComponent>
              </Paper>
            </Grid>
            <Grid item style={{ width: '50%' }}>
              <Paper style={{ padding: 20 }}>
                <LeaderParentComponent
                  title={'Leaders:'}
                  addAction={() => this.addAction('/leaders/', 'Leader')}
                  upload={() => this.uploadAction()}
                >
                  {leaderChildren}
                </LeaderParentComponent>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
        <Dialog
          onClose={this.handleClose}
          aria-labelledby='customized-dialog-title'
          open={this.state.adding}
        >
          <DialogTitle
            id='customized-dialog-title'
            onClose={this.handleCloseEdit}
          >
            Add {this.state.type}
          </DialogTitle>
          <DialogContent style={{ height: 425 }}>
            <Grid container>
              <Grid item container direction='column' spacing={0}>
                <Grid item>
                  <TextField
                    autoFocus={true}
                    style={{ width: 300 }}
                    label='Email'
                    id='email'
                    margin='normal'
                    value={this.state.email}
                    onChange={this.handleEmailChange}
                  />
                </Grid>
                {this.addGroupSelect()}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions style={{ justifyContent: 'center' }}>
            <Button
              variant='contained'
              onClick={this.handleSave}
              color='primary'
            >
              Add User
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          onClose={this.handleCloseUpload}
          aria-labelledby='customized-dialog-title'
          open={this.state.uploading}
        >
          <DialogTitle id='customized-dialog-title'>Upload Leaders</DialogTitle>
          <DialogContent>
            <DialogContentText>
              <h3>Make sure you are uploading a .csv file.</h3>
              <p>
                <strong>How to make a .csv file from Excel</strong>
              </p>
              <ol>
                <li>
                  Start Excel and open the spreadsheet you would like to upload.
                </li>
                <li>
                  At the top of your screen, click on "File", then "Save As".
                </li>
                <li>
                  Click on the dropdown box for "File Format:" (should say
                  "Excel Workbook .xlsx).
                </li>
                <li>Select "CSV UTF-8 (Comma delimited) (.csv)</li>
                <li>Save the file to a location you can later find it.</li>
              </ol>
            </DialogContentText>
            <DialogActions>
              <CSVReader
                onFileLoaded={this.handleFileChanged}
                inputId='something'
                inputStyle={{ color: 'purple' }}
                style={{ margin: 'auto' }}
              />
              <Button
                variant='contained'
                onClick={this.uploadLeaders}
                style={{ backgroundColor: 'blue' }}
                color='primary'
              >
                Submit
              </Button>
            </DialogActions>
          </DialogContent>
        </Dialog>

        <Dialog
          open={this.state.deleting}
          onClose={this.handleDeleteClose}
          aria-labelledby='alert-dialog-title'
          aria-describedby='alert-dialog-description'
        >
          <DialogTitle id='alert-dialog-title'>
            {'Are you sure you want to remove this user?'}
          </DialogTitle>
          <DialogContent>
            <label>{this.state.email}</label>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleDeleteClose} color='primary'>
              Cancel
            </Button>
            <Button onClick={this.deleteUser} color='primary' autoFocus>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

// Parent component for a user to be displayed
const AdminParentComponent = (props) => (
  <div style={{ width: 1000 }}>
    <Grid container id='children-pane' direction='column' spacing={2}>
      <Grid item container>
        <Typography variant='h5'>{props.title}</Typography>
        <Button
          style={{ marginLeft: 10 }}
          onClick={props.addAction}
          color='primary'
          variant='outlined'
        >
          <AddIcon />
          Add
        </Button>
      </Grid>
      {props.children}
    </Grid>
  </div>
);

const LeaderParentComponent = (props) => (
  <div style={{ width: 1000 }}>
    <Grid container id='children-pane' direction='column' spacing={2}>
      <Grid item container>
        <Typography variant='h5'>{props.title}</Typography>
        <Button
          style={{ marginLeft: 10 }}
          onClick={props.addAction}
          color='primary'
          variant='outlined'
        >
          <AddIcon />
          Add Single Leader
        </Button>
        <Button
          style={{ marginLeft: 10 }}
          onClick={props.upload}
          color='primary'
          variant='outlined'
        >
          <AddIcon />
          Upload Leaders
        </Button>
      </Grid>
      {props.children}
    </Grid>
  </div>
);

// Child component for a user to be displayed
const ChildComponent = (props) => (
  <Grid item container>
    <Typography component='p' style={{ marginTop: 5, marginLeft: 10 }}>
      {props.email}
    </Typography>
    <Button color='primary' onClick={props.removeAction}>
      <CloseIcon />
    </Button>
  </Grid>
);

const GroupTitleComponent = (props) => (
  <Typography component='p' style={{ fontWeight: 'bold' }}>
    {props.group}
  </Typography>
);

export default Users;
