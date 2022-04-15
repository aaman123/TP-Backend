# tensorplace-backend


## Branch naming Guidelines
- Make sure you start new branch name with `feature/` as prefix, or else, CI won't trigger.
### Prepare `.env` for the backend server:
- Refer `.env.example` from the repository and add details in it.

## Steps for Production, Staging and Development
- Uncomment the code for accordingly w.r.t Production, Development and staging in:
    - `config/keys.js`
    - `firebase-keys-imp.js`
    - `.env`

## Steps for Staging
- Backend is controlled using the service name `tensorplace_back_staging.service`. Make sure the `.env` file contains the value of `PORT` as 5100.

- Procedure to start the Backend service.

    - Start the VM.

    - Run Command `systemctl start|restart|status tensorplace_back_staging.service`. Use any one of `start|restart|status`. Names are self-explainatory.


## Steps for Production
- Backend is controlled using the service name `tensorplace_back.service`.

- Procedure to start the Backend service.

    - Start the VM.

    - Run Command `systemctl start|restart|status tensorplace_back.service`. Use any one of `start|restart|status`. Names are self-explainatory.

## Stripe Webhooks Start in CLI
- Only works on Localhost with Proper Authentication.
- `stripe listen --forward-to localhost:5000/stripe/webhooks`

## TODO:
- Prepare Dockers for easy Deployment on Staging and Production servers.
- Prepare a CI Pipeline.
- Remove the keys for firebase and config files from the repo contents and Add them to `.env` for security purposes.

## Initialize the repo for Firebase local emulator if not done already.
- Reference : [link](https://firebase.google.com/docs/emulator-suite/connect_and_prototype)

## Check New ENV variables
- Check `.env.example` for new Environment variables.
    - Some tweaking in the APIs have to be done in order to make `ENABLE_MAILING` and `ENABLE_BLOCKCHAIN`. Make sure we add If conditions while running them from tests.
    - Check this for reference. [change](https://github.com/Tensorplace-io/tensorplace-backend/blob/011f903cd255c7e056c7e2a4d8465fbac944fd94/api/controllers/user-api.js#L444)

### TL;DR
- Install Firebase CLI : `npm install -g firebase-tools`
- Check if installed correctly : `curl -sL firebase.tools | bash`
- Initialize the app for firebase : `firebase init`
- To start the emulator : `firebase emulators:start`

## Testing
- `yarn test` : For testing all modules.
- `yarn test <module-name>` : For particular module.

## Local Firestore related
- `sudo apt-get install openjdk-8-jre` will install java jdk to open local firestore.
- `yarn firestore:emulators` will start a fresh instance of local firestore.
- `yarn firestore:import` will import the backed up version present in `./fixtures/firestore`.
- `yarn firestore:export` will create a new copy with exported data, which can be loader using above command.
- `yarn firestore:test` will run all the tests keeping local firestore as the DB.
- Go through `package.json` for more details about the scripts.