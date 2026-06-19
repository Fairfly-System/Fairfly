import {Outlet} from "react-router";
import Navbar from "../../components/Navbar/Navbar";

export default function Index({user}) {
    return (
        <>
            <Navbar></Navbar>
            <Outlet />
        </>
    )
}