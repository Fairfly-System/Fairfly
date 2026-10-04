import { createContext, useState, useEffect, useContext } from 'react'; // Import React
import { onAuthStateChanged, signOut, getAuth, onIdTokenChanged } from 'firebase/auth'; //Get the onAuthStateChanged function from the auth module
import { doc, onSnapshot } from 'firebase/firestore'; //Get the onSnapshot function from the firestore module
import { auth, firestore } from '../firebase'; //get the auth and db objects from the firebase module
import { useToast } from '../components/UI/toast/ToastProvider';

//create a context object (Will be used to share data between components) with the createContext function
const AuthContext = createContext();

//create a provider component
const AuthProvider = ({ children }) => {

    //Consume the useToast hook
    const { addToast } = useToast();
    //Save the user 
    const [user, setUser] = useState(null);
    //Save the user details in the state
    const [userDetails, setUserDetails] = useState(null);
    //Check if Loading
    const [userLoading, setUserLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);

    //UseEffect for firestore user details and Auth
    useEffect(() => {

        //Func to fetch the user details, Null for now
        let unsubscribeToUserDoc = null;

        //Listen to Auth Changes
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            //Clean up the subscription from the previous user
            if (unsubscribeToUserDoc) {
                unsubscribeToUserDoc(); // Unsubscribe from the previous user's document listener
                unsubscribeToUserDoc = null;
            }

            //If no user is present (firebaseUser is null or undefined or "" or 0 or false or NaN or Expired), set the user and userDetails to null and set the loading to false
            if (!firebaseUser) {
                setUser(null);
                setUserDetails(null);
                setUserLoading(false);
                setUserToken(null);
                return;
            }

            //Now Set the user object to the state and their token to the local storage for future use
            setUser(firebaseUser);

            //Listen to token changes and set the token to the state context
            const tokenUnsubscribe = onIdTokenChanged(auth, (user) => {
                if (user) {
                    user.getIdToken().then((token) => {
                        setUserToken(token);
                    }).catch((error) => {
                        console.error('Error getting user token:', error);
                        addToast('Error getting user token.', 'error');
                    });
                } else {
                    setUserToken(null);
                }
            });

            //Now Listen to the user details, Assign unsubscribeToUserDoc to the unsubscribe function
            //Listen to users/UID in the firestore database
            unsubscribeToUserDoc = onSnapshot(doc(firestore, 'users/' + firebaseUser.uid), async (userdoc) => {
                if (userdoc.exists()) {
                    const data = userdoc.data();
                    const status = (data.status || '').toLowerCase();
                    const isAccountDisabled = status === 'disabled' || 
                                              status === 'deactivated' || 
                                              status === 'suspended' || 
                                              status === 'inactive' ||
                                              data.disabled === true;

                    if (isAccountDisabled) {
                        console.warn(`[AuthContext] Current account ${firebaseUser.uid} is disabled/deactivated. Forcing immediate sign-out.`);
                        try {
                            await signOut(auth);
                        } catch (signOutErr) {
                            console.error('Error during forced sign-out of disabled user:', signOutErr);
                        }
                        setUser(null);
                        setUserDetails(null);
                        setUserLoading(false);
                        setUserToken(null);
                        addToast('Your account has been disabled. You have been signed out. Please contact FairFly administration for assistance.', 'error');
                        return;
                    }

                    setUserDetails({ id: userdoc.id, ...data });
                } else {
                    signOut(auth);
                    setUserDetails(null);
                }
                setUserLoading(false);
            }, (error) => {
                addToast('Error fetching user details.', 'error'); //Notify if something went wrong
                console.error('Error fetching user details:', error);
                signOut(auth); //Sign out the user
                //Set the user loading to false
                setUserLoading(false);
            });

        });
        // Clean up the subscription
        return () => {
            unsubscribe();
        };

    }, []);


    return (
        //Return the provider with the user and userDetails with  .Provider
        <AuthContext.Provider value={{ user, userDetails, userLoading, userToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthProvider };

// Make a custom hook for the context and safety
export function useAuthContext() {

    //Make the context object to be returned
    const context = useContext(AuthContext);
    //Safety Catch
    if (!context) {
        throw new Error('useAuthContext must be used within a AuthProvider');
        return;
    }
    return context; //Return the context object
}