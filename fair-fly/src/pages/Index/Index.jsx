import {Outlet} from "react-router";
import Navbar from "../../components/Shared/Navbar/Navbar";

export default function Index({user}) {
    return (
        <div className="public-module-root">
            <Navbar />
            <Outlet />
        </div>
    )
}