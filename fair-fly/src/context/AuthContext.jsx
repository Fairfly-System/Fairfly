import { createContext, useState, useEffect, useContext } from 'react'; // Import React
import {onAuthStateChanged, signOut} from 'firebase/auth'; //Get the onAuthStateChanged function from the auth module
import {doc, onSnapshot} from 'firebase/firestore'; //Get the onSnapshot function from the firestore module
import {getFromDatabase} from '../utils/firebaseutils'; //Get the fetcher function from the firebaseutils module
import {auth, firestore} from '../firebase'; //get the auth and db objects from the firebase module
import { useToast } from '../components/toast/ToastProvider';

//create a context object
const AuthContext = createContext();

//create a provider component
const AuthProvider = ({children}) => {

    const {addToast} = useToast();
    //Save the user 
    const [user, setUser] = useState(null);
    //Save the user details in the state
    const [userDetails, setUserDetails] = useState(null);
    //Check if Loading
    const [userLoading, setUserLoading] = useState(true);

    //UseEffect for firestore user details
    useEffect(() => {

        let unsubscribeToUserDoc = null;

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {

            console.log('User changed');

            //Clean up the subscription from the previous user
            if (unsubscribeToUserDoc) {
                unsubscribeToUserDoc();
                unsubscribeToUserDoc = null;
            }

            //Set the user
            if(!firebaseUser) {
                setUser(null);
                setUserDetails(null);
                setUserLoading(false);
                return;
            }

            //Now Set the user object to the state
            setUser(firebaseUser);
            console.log(firebaseUser.uid);

            //Now Listen to the user details
            unsubscribeToUserDoc = onSnapshot(doc(firestore, 'users/' + firebaseUser.uid), (userdoc) => {
                console.log(`fetching for ${firebaseUser.uid}`);
                if (userdoc.exists()) {
                    console.log('User document exists!');
                    setUserDetails({ id: userdoc.id, ...userdoc.data() });
                } else {
                    signOut(auth);
                    console.log('User document does not exist!');
                    setUserDetails(null);
                }
                setUserLoading(false);
            }, (error) => {
                addToast('Error fetching user details.', 'error');
                console.error('Error fetching user details:', error);
                //Set the user loading to false
                setUserLoading(false);
            });

        });
        // Clean up the subscription
        return () => {
            unsubscribe();
        };

    }, []);

    useEffect(() => {
        console.log(userDetails);
    }, [userDetails]);

    return (
        //Return the provider with the user and userDetails
        <AuthContext.Provider value={{user, userDetails, userLoading}}>
            {children}
        </AuthContext.Provider>
    );
};

export {AuthProvider};

// Make a custom hook for the context and safety
export function useAuthContext() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuthContext must be used within a AuthProvider');
    }

    return context;
}