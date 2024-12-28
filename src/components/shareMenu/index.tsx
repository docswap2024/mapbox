import React, {Fragment, useState} from 'react';
import { Menu, Transition } from '@headlessui/react';
import {ShareIcon} from '@heroicons/react/24/solid';
import {styles} from './styles';
import Link from 'next/link';
import {FaPinterest,  FaFacebook, FaGoogle, FaLinkedinIn, FaCopy, FaPrint} from 'react-icons/fa';
import { usePrint } from '@/context/printContext';

export const ShareMenu = ({url}) => {
    const { handlePrint } = usePrint();
    const [showAlert, setShowAlert] = useState(false);

    function classNames(...classes) {
        return classes.filter(Boolean).join(' ')
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 1000); // Hide alert after 2 seconds
      };

    return (
        <>
        {/* Notification at the top of the page */}
            {showAlert && (
                <div className="fixed top-0 left-1/2 transform -translate-x-1/2 mt-4 py-3 px-5 text-white text-center rounded-3xl shadow-lg z-50 bg-white bg-opacity-10 ">
                Link copied to clipboard!
                </div>
            )}
        <Menu as="div" className={styles.menuDiv}>
            <div>
                <Menu.Button className={styles.buttonAction}>
                    <span className='hidden md:block'>Share</span>
                    <ShareIcon className={styles.shareIcon} aria-hidden="true" />
                </Menu.Button>
            </div>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className={styles.menuItems}>
                <div className="py-1">
                    <Menu.Item>
                        {({ active }) => (
                            <Link href={`https://www.facebook.com/sharer/sharer.php?u=${url}`}   target="_blank" className={classNames(active ? 'bg-grayLight text-brandDarker' : 'text-brandDarker', `${styles.linkItem}`)}>
                            <FaFacebook  className="mr-2" />
                            Facebook
                            </Link>
                        )}
                    </Menu.Item>
                    <Menu.Item>
                        {({ active }) => (
                            <Link href={`http://pinterest.com/pin/create/button/?url=${url}`}  target="_blank"  className={classNames(active ? 'bg-grayLight text-brandDarker' : 'text-brandDarker', `${styles.linkItem}`)}>
                            <FaPinterest  className="mr-2" />
                            Pinterest
                            </Link>
                        )}
                    </Menu.Item>
                    <Menu.Item>
                        {({ active }) => (
                            <Link href={`https://mail.google.com/mail/u/0/?view=cm&to&su=Blog&body=${url}&bcc&cc&fs=1&tf=1"`}   target="_blank" className={classNames(active ? 'bg-grayLight text-brandDarker' : 'text-brandDarker', `${styles.linkItem}`)}>
                            <FaGoogle className="mr-2" />
                            Gmail
                            </Link>
                        )}
                    </Menu.Item>
                    <Menu.Item>
                        {({ active }) => (
                            <Link href={`https://twitter.com/intent/tweet?url=${url}`}  target="_blank" className={classNames(active ? 'bg-grayLight text-brandDarker' : 'text-brandDarker', `${styles.linkItem}`)}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2 fill-brandDarker" viewBox="0 0 512 512">
                                    <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
                                </svg>
                            X
                            </Link>
                        )}
                    </Menu.Item>
                    <Menu.Item>
                        {({ active }) => (
                            <Link href={`https://linkedin.com/shareArticle?url=${url}`} target="_blank" className={classNames(active ? 'bg-grayLight text-brandDarker' : 'text-brandDarker', `${styles.linkItem}`)}>
                            <FaLinkedinIn className="mr-2" />
                            LinkedIn
                            </Link>
                        )}
                    </Menu.Item>
                    <Menu.Item>
                        {({ active }) => (
                            <button 
                            onClick={handleCopy}
                            className={classNames(active ? 'bg-grayLight text-brandDarker w-full' : 'text-brandDarker', `${styles.linkItem}`)}>
                            <FaCopy className="mr-2" />
                            Copy Link 
                            </button>
                        )}
                    </Menu.Item>
                    <Menu.Item>
                        {({ active }) => (
                            <button 
                            onClick={() => handlePrint(url)}
                            className={classNames(active ? 'bg-grayLight text-brandDarker w-full' : 'text-brandDarker', `${styles.linkItem}`)}>
                            <FaPrint className="mr-2" />
                            Print
                            </button>
                        )}
                    </Menu.Item>
                </div>
                </Menu.Items>
            </Transition>
        </Menu>
        </>
    );
}