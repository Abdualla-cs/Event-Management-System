import React from 'react';
import InstagramIcon from "@mui/icons-material/Instagram";
import TwitterIcon from "@mui/icons-material/Twitter";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";

function Footer({ isAdmin, user }) {
    const socialLinks = {
        instagram: "https://instagram.com/yallaevent",
        twitter: "https://twitter.com/yallaevent",
        facebook: "https://facebook.com/yallaevent",
        linkedin: "https://linkedin.com/company/yallaevent"
    };

    const handleSocialClick = (platform) => {
        window.open(socialLinks[platform], '_blank', 'noopener,noreferrer');
    };

    return (
        <footer className="bg-gray-800 text-white py-6 sm:py-8 mt-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 gap-6 sm:gap-8 mb-6">
                    <div className="text-center sm:text-left">
                        <h3 className="text-lg font-bold mb-3 sm:mb-4 text-[#FC350B]">YallaEvent</h3>
                        <p className="text-gray-300 text-sm">
                            Your all-in-one digital partner for planning, organizing, and elevating events.
                        </p>
                    </div>

                    <div className="text-center sm:text-left">
                        <h4 className="font-semibold mb-3 flex items-center justify-center sm:justify-start gap-2">
                            <LocationOnIcon className="text-[#FC350B]" />
                            Our Location
                        </h4>
                        <p className="text-gray-300 text-sm">
                            Beirut, Al Hamra, Verdun Street,<br />
                            Crystal Center, 5th Floor,<br />
                            Office 502
                        </p>
                    </div>

                    <div className="text-center sm:text-left">
                        <h4 className="font-semibold mb-3">Contact Us</h4>
                        <div className="space-y-2 text-gray-300 text-sm">
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                                <PhoneIcon className="text-[#FC350B] text-sm" />
                                <span>+961 81 082 001</span>
                            </div>
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                                <EmailIcon className="text-[#FC350B] text-sm" />
                                <span>support@yallaevent.com</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-center sm:text-left">
                        <h4 className="font-semibold mb-3">Follow Us</h4>
                        <div className="flex justify-center sm:justify-start space-x-3">
                            <button
                                onClick={() => handleSocialClick('instagram')}
                                className="p-2 bg-gray-700 rounded-full hover:bg-[#FC350B] transition-colors"
                                aria-label="Instagram"
                            >
                                <InstagramIcon className="text-white text-sm" />
                            </button>
                            <button
                                onClick={() => handleSocialClick('twitter')}
                                className="p-2 bg-gray-700 rounded-full hover:bg-[#FC350B] transition-colors"
                                aria-label="Twitter"
                            >
                                <TwitterIcon className="text-white text-sm" />
                            </button>
                            <button
                                onClick={() => handleSocialClick('facebook')}
                                className="p-2 bg-gray-700 rounded-full hover:bg-[#FC350B] transition-colors"
                                aria-label="Facebook"
                            >
                                <FacebookIcon className="text-white text-sm" />
                            </button>
                            <button
                                onClick={() => handleSocialClick('linkedin')}
                                className="p-2 bg-gray-700 rounded-full hover:bg-[#FC350B] transition-colors"
                                aria-label="LinkedIn"
                            >
                                <LinkedInIcon className="text-white text-sm" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-6 flex flex-col space-y-4 sm:space-y-0 sm:flex-row justify-between items-center">
                    <p className="text-gray-400 text-sm text-center sm:text-left">
                        &copy; 2024 YallaEvent Management System. All rights reserved.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                        {isAdmin && (
                            <span className="text-sm text-gray-400 text-center">
                                Admin: {user?.email?.split('@')[0] || 'Logged in'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;