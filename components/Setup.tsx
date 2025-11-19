import React, { useState, useContext, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../App';
import { 
    FaEye, FaEyeSlash, FaKey, FaWallet, FaCopy, FaCircleCheck, FaShieldHalved, FaRocket, FaChevronLeft, 
    FaSun, FaStar, FaBolt, FaUserAstronaut
} from 'react-icons/fa6';
import Loader from './Loader';
import Ballpit from './Ballpit';
import gsap from 'gsap';

// --- Type Definition for Views ---
type View = 'onboarding' | 'create_name' | 'welcome' | 'create_generate' | 'create_confirm_phrase' | 'create_set_password' | 'import_phrase' | 'import_set_password' | 'unlock' | 'customize_card' | 'create_success';


// --- Reusable Button with GSAP Animation ---
const AnimatedButton = ({ onClick, disabled = false, className, children }: { onClick?: () => void, disabled?: boolean, className?: string, children: React.ReactNode }) => {
  const btnRef = useRef(null);

  const handleTap = () => {
    if (disabled) return;
    if (btnRef.current) {
        gsap.to(btnRef.current, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });
    }
    if (onClick) onClick();
  };
  
  return (
    <button ref={btnRef} onClick={handleTap} disabled={disabled} className={className}>
      {children}
    </button>
  );
};

const OnboardingLayout = ({ title, subtitle, children, footer }: { title: React.ReactNode, subtitle: string, children: React.ReactNode, footer: React.ReactNode }) => {
  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-3">{title}</h1>
          <p className="text-text-secondary mb-8">{subtitle}</p>
        </div>
        {children}
      </div>
      <div className="pt-4">{footer}</div>
    </div>
  );
};


// --- Reusable and View-Specific Components ---
const MnemonicGrid = ({ words, editable = false, value, onWordsChange }: { words: string[], editable?: boolean, value?: string[], onWordsChange?: (startIndex: number, words: string[]) => void }) => {
  const gridRef = useRef(null);
  
  useEffect(() => {
    if (gridRef.current) {
        gsap.fromTo(
            (gridRef.current as HTMLElement).children, 
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: 'power3.out' }
        );
    }
  }, []);
  
  const handlePaste = (e: React.ClipboardEvent, startIndex: number) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');
    const pastedWords = pastedText.trim().split(/\s+/).map(w => w.toLowerCase());
    if (pastedWords.length > 0 && onWordsChange) {
      onWordsChange(startIndex, pastedWords);
    }
  };


  return (
  <div ref={gridRef} className="grid grid-cols-3 gap-2">
    {words.map((word, index) => (
      <div key={index} className="flex items-center bg-surface-light rounded-lg p-2">
        <span className="text-text-secondary text-sm mr-2">{index + 1}.</span>
        {editable ? (
          <input
            type="text"
            value={value[index]}
            onPaste={(e) => handlePaste(e, index)}
            onChange={(e) => {
                const words = e.target.value.trim().split(/\s+/).map(w => w.toLowerCase());
                if (onWordsChange) {
                    onWordsChange(index, words);
                }
            }}
            className="bg-transparent w-full text-text-primary text-sm focus:outline-none"
            autoCapitalize="none"
            autoCorrect="off"
          />
        ) : (
          <span className="text-text-primary text-sm">{word}</span>
        )}
      </div>
    ))}
  </div>
)};

const UnlockView = ({ password, setPassword, showPassword, setShowPassword, error, loading, handleUnlock }) => {
    const errorRef = useRef(null);
    useEffect(() => {
        if(error && errorRef.current) {
            gsap.fromTo(errorRef.current, {x: -5}, {x: 5, duration: 0.05, repeat: 5, yoyo: true, clearProps: 'x'});
        }
    }, [error]);
    
    return (
    <div className="flex flex-col h-full p-8">
        <div className="flex-1 flex flex-col justify-center items-center text-center">
            <FaKey className="w-16 h-16 text-primary mb-6"/>
            <h1 className="text-3xl font-bold mb-2">Wallet Locked</h1>
            <p className="text-text-secondary mb-8">Enter your password to unlock.</p>
            <div className="w-full relative bg-surface-light rounded-2xl">
              <input 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  className="w-full bg-transparent p-4 rounded-2xl pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-4 text-text-secondary">{showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}</button>
            </div>
            {error && <p ref={errorRef} className="text-red-500 text-sm mt-4">{error}</p>}
        </div>
        <AnimatedButton onClick={handleUnlock} disabled={loading} className="mt-6 w-full bg-primary active:bg-primary-hover text-white font-bold py-4 rounded-2xl flex justify-center text-lg">
            {loading ? <Loader /> : 'Unlock'}
        </AnimatedButton>
    </div>
)};

const OnboardingView = ({ onComplete }: { onComplete: () => void }) => {
    const [step, setStep] = useState(0);
    const slideRef = useRef<HTMLDivElement>(null);
    const isTransitioning = useRef(false);

    const slides = [
        { icon: FaWallet, title: "Welcome to Pocki!", text: "Your friendly, fun, and secure home for digital assets." },
        { icon: FaShieldHalved, title: "You're In Control", text: "Pocki is non-custodial, meaning only you have access to your funds. Your keys, your crypto." },
        { icon: FaRocket, title: "Ready to Explore?", text: "Let's set up your wallet and begin your journey into the decentralized world." },
    ];

    useEffect(() => {
        isTransitioning.current = false; // Reset lock on mount/step change
        if (!slideRef.current) return;
        gsap.killTweensOf(slideRef.current);
        gsap.fromTo(slideRef.current, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'power3.out' });
    }, [step]);
    
    const nextStep = () => {
        if (isTransitioning.current || !slideRef.current) return;
        isTransitioning.current = true;
        
        // We use overwrite: true to ensure this tween takes precedence, though isTransitioning prevents concurrent calls.
        gsap.to(slideRef.current, { 
            opacity: 0, 
            scale: 0.95, 
            duration: 0.2, 
            ease: 'power3.in',
            overwrite: true,
            onComplete: () => {
                if (step < slides.length - 1) {
                    setStep(s => s + 1);
                } else {
                    onComplete();
                }
                // Note: isTransitioning reset is handled in useEffect for step change or by unmount for onComplete
            }
        });
    };

    const slide = slides[step];

    if (!slide) return null;

    const { icon: Icon, title, text } = slide;

    return (
        <div className="h-full flex flex-col justify-between p-8 text-center bg-surface">
            <div ref={slideRef} className="flex flex-col items-center flex-1 justify-center">
                <div className="bg-primary/10 text-primary rounded-3xl p-8 mb-12">
                  <Icon className="w-20 h-20"/>
                </div>
                <h1 className="text-4xl font-bold mb-6">{title}</h1>
                <p className="text-text-secondary text-lg">{text}</p>
            </div>
            <div className="w-full">
                <div className="flex justify-center gap-2 mb-8">
                    {slides.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-primary' : 'bg-surface-light'}`}/>)}
                </div>
                <AnimatedButton onClick={nextStep} className="w-full bg-primary active:bg-primary-hover text-white font-bold py-4 rounded-2xl text-lg">
                    {step === slides.length - 1 ? "Get Started" : "Continue"}
                </AnimatedButton>
            </div>
        </div>
    )
}

const NameView = ({ name, setName, onComplete }: { name: string, setName: (name: string) => void, onComplete: () => void }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (inputRef.current) {
            gsap.fromTo(inputRef.current, {y: 20, opacity: 0}, {y: 0, opacity: 1, duration: 0.4, delay: 0.1, ease: 'power3.out'});
        }
    }, []);
    return (
        <div className="flex flex-col h-full p-8 text-center">
            <div className="flex-1 flex flex-col justify-center">
                <div>
                    <h1 className="text-4xl font-bold mb-4">What should we call you?</h1>
                    <p className="text-text-secondary mb-8">This name is stored locally and is only visible to you.</p>
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="E.g. Sam"
                            className="w-full bg-surface-light p-4 rounded-2xl text-center text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            maxLength={20}
                        />
                    </div>
                </div>
            </div>
            <AnimatedButton onClick={onComplete} disabled={!name.trim()} className="w-full bg-primary active:bg-primary-hover text-white font-bold py-4 rounded-2xl text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                Continue
            </AnimatedButton>
        </div>
    )
}

const ICON_MAP = { FaSun, FaStar, FaRocket, FaBolt, FaUserAstronaut };

const CustomizeCardView = ({ onComplete, color, setColor, icon, setIcon }) => {
    const colors = [
        { id: 'sunset', class: 'from-amber-400 to-rose-500' },
        { id: 'ocean', class: 'from-cyan-400 to-blue-600' },
        { id: 'forest', class: 'from-green-400 to-emerald-600' },
        { id: 'galaxy', class: 'from-violet-500 to-fuchsia-500' },
        { id: 'midnight', class: 'from-neutral-800 to-black' },
    ];
    const icons = Object.keys(ICON_MAP);
    const CardIcon = ICON_MAP[icon];

    return (
        <OnboardingLayout
            title="Customize Your Card"
            subtitle="Choose a look for your wallet card. You can change this later."
            footer={
                <AnimatedButton onClick={onComplete} className="w-full bg-primary active:bg-primary-hover text-white font-bold py-4 rounded-2xl text-lg">
                    Continue
                </AnimatedButton>
            }
        >
            <div className={`w-full max-w-sm mx-auto bg-gradient-to-br ${color} rounded-3xl p-6 shadow-lg text-white mb-8`}>
                <div className="flex justify-between items-start">
                    <div className="p-3 bg-white/30 rounded-full">
                        <CardIcon className="w-5 h-5 text-white" />
                    </div>
                </div>
                <div className="mt-12 text-left">
                    <p className="font-bold text-lg">My Wallet</p>
                    <p className="font-bold text-2xl">0 ETH</p>
                </div>
            </div>
            
            <div className="mb-6">
                <p className="font-bold mb-3 text-center">Color</p>
                <div className="flex justify-center gap-3">
                    {colors.map(c => (
                        <button key={c.id} onClick={() => setColor(c.class)} className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.class} ${color === c.class ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : ''}`} />
                    ))}
                </div>
            </div>
            <div>
                <p className="font-bold mb-3 text-center">Icon</p>
                <div className="flex justify-center gap-3">
                    {icons.map(iconKey => {
                        const IconComponent = ICON_MAP[iconKey];
                        return (
                            <button key={iconKey} onClick={() => setIcon(iconKey)} className={`w-10 h-10 rounded-full flex items-center justify-center ${icon === iconKey ? 'bg-primary text-white' : 'bg-surface-light'}`}>
                                <IconComponent className="w-5 h-5" />
                            </button>
                        );
                    })}
                </div>
            </div>
        </OnboardingLayout>
    );
};


// --- Main Setup Component ---
const Setup: React.FC<{isOnboarding?: boolean; onOnboardingComplete?: (data: { name: string; color: string; icon: string; }) => void;}> = ({ isOnboarding = false, onOnboardingComplete }) => {
  const { unlockWallet, setupWallet, encryptedKey } = useContext(WalletContext);
  const [view, setView] = useState<View>('welcome');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [confirmMnemonic, setConfirmMnemonic] = useState(Array(12).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState('');
  const [cardColor, setCardColor] = useState('from-amber-400 to-rose-500');
  const [cardIcon, setCardIcon] = useState('FaSun');
  
  const contentRef = useRef(null);
  const [animationDirection, setAnimationDirection] = useState(1); // 1 for forward, -1 for backward
  const [initialized, setInitialized] = useState(false);
  const isExiting = useRef(false);

  const changeView = (newView: View, direction: number = 1) => {
    if (!contentRef.current) return;
    if (isExiting.current) return; // Prevent double submission
    
    if (!initialized) setInitialized(true);
    setAnimationDirection(direction);
    isExiting.current = true;
    
    // Use overwrite to ensure this transition takes precedence
    gsap.to(contentRef.current, {
        x: -100 * direction,
        opacity: 0,
        duration: 0.2,
        ease: 'power3.in',
        overwrite: true,
        onComplete: () => {
            isExiting.current = false;
            setView(newView);
        }
    });
  };

  useEffect(() => {
    if (initialized) return;

    if (isOnboarding) {
        setView('onboarding');
    } else if (encryptedKey) {
      setView('unlock');
    } else {
      setView('welcome');
    }

    if (encryptedKey || isOnboarding) {
      setInitialized(true);
    }

  }, [encryptedKey, isOnboarding, initialized]);

  useEffect(() => {
    // Ensure exiting flag is false when new view mounts
    isExiting.current = false;
    
    if (contentRef.current) {
        // Use overwrite to kill any lingering exit animations if the state updated rapidly
        gsap.fromTo(contentRef.current, 
            { x: 100 * animationDirection, opacity: 0 }, 
            { x: 0, opacity: 1, duration: 0.3, ease: 'power3.out', overwrite: true }
        );
    }
  }, [view]);

  const handleGenerateMnemonic = () => {
    const newMnemonic = ethers.Wallet.createRandom().mnemonic.phrase;
    setMnemonic(newMnemonic);
    setNewWalletAddress(ethers.Wallet.fromPhrase(newMnemonic).address);
    changeView('create_generate');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmBackup = () => {
     if (confirmMnemonic.join(' ') !== mnemonic) {
       setError("The words do not match your recovery phrase. Please try again.");
       return;
     }
     setError('');
     changeView('create_set_password');
  };
  
  const handleCreateWallet = async () => {
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters long'); return; }
    setError('');
    setLoading(true);
    await setupWallet(mnemonic, password);
    setLoading(false);
    changeView('customize_card');
  };

  const handleVerifyPhrase = () => {
    if (!ethers.Mnemonic.isValidMnemonic(mnemonic.trim())) {
      setError('Invalid recovery phrase. Please check the words and try again.');
      return;
    }
    setError('');
    changeView('import_set_password');
  }

  const handleImportWallet = async () => {
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters long'); return; }
    setError('');
    setLoading(true);
    setNewWalletAddress(ethers.Wallet.fromPhrase(mnemonic).address);
    await setupWallet(mnemonic, password);
    setLoading(false);
    changeView('customize_card');
  };

  const handleUnlock = async () => {
    setError('');
    setLoading(true);
    const success = await unlockWallet(password);
    if (!success) { setError('Invalid password'); }
    setLoading(false);
  };
  
  const handleCustomizationComplete = () => {
    changeView('create_success');
  };
  
  const handleMnemonicWordsChange = (startIndex: number, words: string[]) => {
      setConfirmMnemonic(currentMnemonic => {
          const newMnemonic = [...currentMnemonic];
          for (let i = 0; i < words.length; i++) {
              if (startIndex + i < 12) {
                  newMnemonic[startIndex + i] = words[i];
              }
          }
          return newMnemonic;
      });
  };

  const SuccessView = () => {
    const titleRef = useRef(null);
    const cardRef = useRef(null);
    const textRef = useRef(null);
    const btnRef = useRef(null);
    const CardIcon = ICON_MAP[cardIcon];

    useEffect(() => {
        const title = titleRef.current;
        const card = cardRef.current;
        const text = textRef.current;
        const btn = btnRef.current;

        // Set initial state to invisible to prevent flicker before animation starts
        gsap.set([title, card, text, btn], { autoAlpha: 0 });
        gsap.set(title, { y: 20 });
        gsap.set(card, { scale: 0.8 });
        gsap.set(text, { y: 10 });
        gsap.set(btn, { y: 10 });

        const tl = gsap.timeline({ delay: 0.1 });
        tl.to(title, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out' })
          .to(card, { scale: 1, autoAlpha: 1, duration: 0.6, ease: 'back.out(1.7)' }, "-=0.3")
          .to(text, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out' }, "-=0.3")
          .to(btn, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out' }, "-=0.3");
    }, []);

    return (
        <div className="flex flex-col justify-between items-center text-center p-8 h-full bg-surface">
            <div className="flex-1 flex flex-col justify-center items-center w-full">
                <h1 ref={titleRef} className="text-4xl font-bold">Your wallet is <span className="text-accent">ready.</span></h1>
                <div ref={cardRef} className={`w-full max-w-sm mt-8 bg-gradient-to-br ${cardColor} rounded-3xl p-6 shadow-lg text-white`}>
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-white/30 rounded-full">
                           <CardIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-right flex items-center gap-2 cursor-pointer" onClick={() => copyToClipboard(newWalletAddress)}>
                            <p className="font-mono text-sm">{`${newWalletAddress.slice(0, 6)}...${newWalletAddress.slice(-4)}`}</p>
                            <FaCopy className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-12 text-left">
                        <p className="font-bold text-lg">{name}</p>
                        <p className="font-bold text-2xl">0 ETH</p>
                    </div>
                     <div className="mt-2 flex justify-end items-center">
                        <div className="flex items-center gap-2 bg-black/20 text-white px-3 py-1 rounded-full text-sm">
                            <FaCircleCheck className="w-4 h-4"/>
                            <span>Backed Up</span>
                        </div>
                    </div>
                </div>
                 <p ref={textRef} className="text-text-secondary mt-6">Your wallet was added to your Pocket.</p>
            </div>
            <div ref={btnRef} className="w-full max-w-md">
                <AnimatedButton onClick={() => onOnboardingComplete && onOnboardingComplete({ name, color: cardColor, icon: cardIcon })} className="w-full bg-accent active:bg-accent-hover text-white font-bold py-4 px-4 rounded-2xl flex items-center justify-center text-lg">
                    View Wallet
                </AnimatedButton>
            </div>
        </div>
    );
  }
  
  const renderContent = () => {
    switch(view) {
      case 'onboarding':
        return <OnboardingView onComplete={() => changeView('create_name')} />;

      case 'create_name':
        return <NameView name={name} setName={setName} onComplete={() => changeView('welcome')} />;

      case 'welcome':
        return (
          <div className="flex flex-col justify-center text-center p-8 h-full relative overflow-hidden">
             <div className="absolute inset-0 z-0 pointer-events-none">
                <Ballpit
                    colors={[0x8e2de2, 0x4a00e0, 0x00c6ff]} // purple, violet, blue
                    gravity={4}
                    friction={0.8}
                    wallBounce={0.95}
                    count={20}
                />
             </div>
             <div className="relative z-10 flex flex-col justify-center flex-1">
                <h1 className="text-5xl font-bold mb-4">Your crypto. Your control.</h1>
                <p className="text-text-secondary mb-10 text-lg">Create a brand new wallet or add an existing one to get started easily.</p>
                <div className="w-full space-y-3">
                  <AnimatedButton onClick={handleGenerateMnemonic} className="w-full bg-primary active:bg-primary-hover text-white font-bold py-4 px-4 rounded-2xl text-lg">
                      Create a New Wallet
                  </AnimatedButton>
                  <AnimatedButton onClick={() => changeView('import_phrase')} className="w-full bg-surface-light active:bg-neutral-200 dark:bg-neutral-800 dark:active:bg-neutral-700 text-text-primary font-bold py-4 px-4 rounded-2xl text-lg">
                      Add an Existing Wallet
                  </AnimatedButton>
                </div>
                <p className="text-xs text-text-secondary mt-6">By using Pocki, you agree to our Terms of Use.</p>
             </div>
          </div>
        );

      case 'create_generate':
        return (
            <OnboardingLayout
                title="Your Recovery Phrase"
                subtitle="Write down these 12 words in order and store them somewhere safe. This is the only way to recover your wallet."
                footer={
                    <AnimatedButton onClick={() => changeView('create_confirm_phrase')} className="w-full bg-primary active:bg-primary-hover text-white font-bold py-4 rounded-2xl text-lg">
                        I've Backed It Up
                    </AnimatedButton>
                }
            >
                <MnemonicGrid words={mnemonic.split(' ')} />
                <div className="mt-4 text-center">
                    <button onClick={() => copyToClipboard(mnemonic)} className="text-primary inline-flex items-center gap-2">
                        <FaCopy className="w-4 h-4" /> {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </OnboardingLayout>
        );

      case 'create_confirm_phrase':
        return (
            <OnboardingLayout
                title="Confirm Your Phrase"
                subtitle="Enter your 12-word recovery phrase to confirm you have backed it up correctly."
                footer={
                    <AnimatedButton onClick={handleConfirmBackup} className="w-full bg-primary active:bg-primary-hover text-white font-bold py-4 rounded-2xl text-lg">
                        Confirm
                    </AnimatedButton>
                }
            >
              <MnemonicGrid 
                words={Array(12).fill('')} 
                editable 
                value={confirmMnemonic} 
                onWordsChange={handleMnemonicWordsChange}
              />
              {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
            </OnboardingLayout>
        );

      case 'create_set_password':
      case 'import_set_password':
        const isImport = view === 'import_set_password';
        return (
            <OnboardingLayout
                title={isImport ? "Set a Password" : "Secure Your Wallet"}
                subtitle="This password unlocks your wallet on this device only."
                footer={
                    <AnimatedButton onClick={isImport ? handleImportWallet : handleCreateWallet} disabled={loading} className="w-full bg-primary active:bg-primary-hover text-white font-bold py-4 rounded-2xl flex justify-center text-lg">
                        {loading ? <Loader /> : isImport ? 'Import Wallet' : 'Create Wallet'}
                    </AnimatedButton>
                }
            >
                 <div className="bg-surface-light rounded-xl">
                    <div className="relative border-b border-separator">
                        <input type={showPassword ? 'text' : 'password'} placeholder="Password (min. 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent p-4 pr-10 focus:outline-none" />
                        <button onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 text-text-secondary">{showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}</button>
                    </div>
                    <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-transparent p-4 pr-10 focus:outline-none" />
                    </div>
                </div>
                {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
            </OnboardingLayout>
        );
      
      case 'import_phrase':
        return (
            <OnboardingLayout
                title="Import Wallet"
                subtitle="Enter your 12-word recovery phrase to restore a wallet."
                footer={
                    <AnimatedButton onClick={handleVerifyPhrase} className="w-full bg-primary active:bg-primary-hover text-white font-bold py-4 rounded-2xl text-lg">
                        Continue
                    </AnimatedButton>
                }
            >
                <textarea
                    placeholder="Enter your 12-word recovery phrase here, separated by spaces..."
                    value={mnemonic}
                    onChange={(e) => setMnemonic(e.target.value)}
                    rows={4}
                    className="w-full bg-surface-light p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    autoCapitalize="none"
                    autoCorrect="off"
                />
                {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
            </OnboardingLayout>
        );

      case 'unlock':
        return <UnlockView {...{ password, setPassword, showPassword, setShowPassword, error, loading, handleUnlock }} />;
      
      case 'customize_card':
        return <CustomizeCardView onComplete={handleCustomizationComplete} color={cardColor} setColor={setCardColor} icon={cardIcon} setIcon={setCardIcon} />;

      case 'create_success':
        return <SuccessView />;

      default:
        return null;
    }
  };

  const showBackButton = ['create_generate', 'create_confirm_phrase', 'create_set_password', 'import_phrase', 'import_set_password', 'customize_card'].includes(view);
  const handleBack = () => {
      setError('');
      if (view === 'create_generate') changeView('welcome', -1);
      if (view === 'create_confirm_phrase') changeView('create_generate', -1);
      if (view === 'create_set_password') changeView('create_confirm_phrase', -1);
      if (view === 'import_phrase') changeView('welcome', -1);
      if (view === 'import_set_password') changeView('import_phrase', -1);
      if (view === 'customize_card') {
        if(mnemonic) changeView('create_set_password', -1)
        else changeView('import_set_password', -1)
      }
  }

  return (
    <div className="h-full flex flex-col bg-surface overflow-hidden">
       {showBackButton && (
        <button onClick={handleBack} className="absolute top-4 left-4 text-text-primary z-10 p-2 flex items-center gap-1 text-lg text-primary">
          <FaChevronLeft className="w-6 h-6" />
        </button>
      )}
      <div ref={contentRef} className="h-full flex flex-col">
        {renderContent()}
      </div>
    </div>
  );
};

export default Setup;