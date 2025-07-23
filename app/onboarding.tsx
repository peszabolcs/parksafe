import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const onboardingData = [
  {
    id: 1,
    title: "Üdvözlünk a ParkSafe-ben!",
    subtitle:
      "Találd meg a legjobb parkolóhelyeket és kerékpár javítókat a környékeden egyszerűen és gyorsan",
    icon: "location",
    gradient: ["#667eea", "#764ba2"],
    particles: 8,
    delay: 0,
  },
  {
    id: 2,
    title: "Interaktív térkép",
    subtitle:
      "Böngészd a térképet és fedezd fel az összes elérhető szolgáltatást valós időben",
    icon: "map",
    gradient: ["#f093fb", "#f5576c"],
    particles: 12,
    delay: 300,
  },
  {
    id: 3,
    title: "Szűrők és keresés",
    subtitle:
      "Válaszd ki pontosan, mit keresel: parkolóhely vagy kerékpár javító. Szűrd távolság szerint is",
    icon: "options",
    gradient: ["#4facfe", "#00f2fe"],
    particles: 10,
    delay: 600,
  },
  {
    id: 4,
    title: "Kedvencek mentése",
    subtitle:
      "Jelöld meg kedvenc helyeidet egy érintéssel, hogy később villámgyorsan megtaláld őket",
    icon: "heart",
    gradient: ["#fa709a", "#fee140"],
    particles: 15,
    delay: 900,
  },
  {
    id: 5,
    title: "Készen állsz?",
    subtitle:
      "Most már ismered az összes funkciót! Kezdd el felfedezni a várost biztonságos parkolással!",
    icon: "rocket",
    gradient: ["#a8edea", "#fed6e3"],
    particles: 20,
    delay: 1200,
  },
];

interface ParticleProps {
  index: number;
  delay: number;
}

const AnimatedParticle: React.FC<ParticleProps> = ({ index, delay }) => {
  const translateY = useRef(new Animated.Value(height)).current;
  const translateX = useRef(new Animated.Value(Math.random() * width)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = 3000 + Math.random() * 2000;
    const startDelay = delay + Math.random() * 1000;

    const animate = () => {
      // Reset values
      translateY.setValue(height + 50);
      translateX.setValue(Math.random() * width);
      opacity.setValue(0);
      scale.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.delay(duration - 1000),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.delay(duration - 1600),
          Animated.timing(scale, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Loop the animation
        setTimeout(animate, Math.random() * 2000);
      });
    };

    setTimeout(animate, startDelay);
  }, [delay]);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          transform: [{ translateX }, { translateY }, { scale }],
          opacity,
        },
      ]}
    />
  );
};

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLastSlide, setIsLastSlide] = useState(false);

  // Main animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Progress animation (separate from glow to avoid conflicts)
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Separate glow animations (can use native driver)
  const glowOpacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    setIsLastSlide(currentIndex === onboardingData.length - 1);

    // Animate progress bar (width animation only - no native driver)
    Animated.timing(progressAnim, {
      toValue: (currentIndex + 1) / onboardingData.length,
      duration: 800,
      useNativeDriver: false, // Must be false for width property
    }).start();

    // Reset and start entrance animations
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    scaleAnim.setValue(0.3);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous logo rotation - independent loop
    const startLogoRotation = () => {
      logoRotate.setValue(0);
      const rotateLoop = () => {
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }).start(rotateLoop);
      };
      rotateLoop();
    };

    // Start logo rotation only once to avoid conflicts
    if (currentIndex === 0) {
      startLogoRotation();
    }

    // Glow effect animation - completely separate from width animations
    const startGlowAnimation = () => {
      const glowLoop = () => {
        Animated.sequence([
          Animated.timing(glowOpacityAnim, {
            toValue: 0.8,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacityAnim, {
            toValue: 0.3,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]).start(glowLoop);
      };
      glowLoop();
    };

    // Start glow animation independently
    setTimeout(startGlowAnimation, 100);

    // Pulse animation for icon - separate to avoid conflicts
    const startPulseAnimation = () => {
      pulseAnim.setValue(1);
      const pulseLoop = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]).start(pulseLoop);
      };
      pulseLoop();
    };

    // Start pulse animation after a small delay
    setTimeout(startPulseAnimation, 200);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      // Exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex(currentIndex + 1);
      });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    setCurrentIndex(onboardingData.length - 1);
  };

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem("hasSeenOnboarding_global", "true");

      // Spectacular exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        router.replace("/login");
      });
    } catch (error) {
      console.error("Error saving onboarding state:", error);
      router.replace("/login");
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex(currentIndex - 1);
      });
    }
  };

  const currentSlide = onboardingData[currentIndex];

  const logoRotation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // No need for interpolation - glowOpacityAnim already animates between 0.3 and 0.8

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Animated Particles Background */}
      <View style={styles.particlesContainer}>
        {Array.from({ length: currentSlide.particles }).map((_, index) => (
          <AnimatedParticle
            key={`${currentIndex}-${index}`}
            index={index}
            delay={currentSlide.delay + index * 100}
          />
        ))}
      </View>

      <LinearGradient
        colors={currentSlide.gradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header with logo and controls */}
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ rotate: logoRotation }],
              },
            ]}
          >
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Animated.View
              style={[styles.logoGlow, { opacity: glowOpacityAnim }]}
            />
          </Animated.View>

          {!isLastSlide && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Kihagyás</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Spectacular Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.progressGlow,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                  opacity: 0.5, // Static opacity to avoid conflicts
                },
              ]}
            />
          </View>
        </View>

        {/* Main spectacular content */}
        <View style={styles.content}>
          {/* Animated icon with multiple effects */}
          <View style={styles.iconContainer}>
            <Animated.View
              style={[
                styles.iconGlow,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: glowOpacityAnim,
                },
              ]}
            />
            <Animated.View
              style={{
                transform: [{ scale: scaleAnim }],
              }}
            >
              <Animated.View
                style={[
                  styles.iconBackground,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <Ionicons
                  name={currentSlide.icon as any}
                  size={80}
                  color="white"
                />
              </Animated.View>
            </Animated.View>
          </View>

          {/* Spectacular text content */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Animated.Text
              style={[
                styles.title,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {currentSlide.title}
            </Animated.Text>
            <Animated.Text
              style={[
                styles.subtitle,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              {currentSlide.subtitle}
            </Animated.Text>
          </Animated.View>
        </View>

        {/* Bottom navigation with spectacular effects */}
        <View style={styles.bottomContainer}>
          {/* Animated dots indicator */}
          <View style={styles.dotsContainer}>
            {onboardingData.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setCurrentIndex(index)}
                style={styles.dotContainer}
              >
                <Animated.View
                  style={[
                    styles.dot,
                    index === currentIndex && styles.activeDot,
                    index === currentIndex && {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                />
                {index === currentIndex && (
                  <Animated.View
                    style={[styles.dotGlow, { opacity: glowOpacityAnim }]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Spectacular navigation buttons */}
          <View style={styles.buttonsContainer}>
            {currentIndex > 0 && (
              <TouchableOpacity
                onPress={handlePrevious}
                style={styles.prevButton}
              >
                <Ionicons name="chevron-back" size={24} color="white" />
                <Text style={styles.buttonText}>Vissza</Text>
              </TouchableOpacity>
            )}

            <View style={styles.spacer} />

            <TouchableOpacity
              onPress={handleNext}
              style={[styles.nextButton, isLastSlide && styles.finishButton]}
            >
              <Text style={styles.buttonText}>
                {isLastSlide ? "Kezdjük!" : "Tovább"}
              </Text>
              <Ionicons
                name={isLastSlide ? "rocket" : "chevron-forward"}
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  particlesContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  particle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  gradient: {
    flex: 1,
    zIndex: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  headerLogo: {
    width: 40,
    height: 40,
  },
  logoGlow: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  skipButton: {
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  skipText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressContainer: {
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  progressBackground: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 3,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  progressGlow: {
    position: "absolute",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 3,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
  },
  iconBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 20,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.95)",
    textAlign: "center",
    lineHeight: 28,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    paddingHorizontal: 10,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  dotContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    width: 32,
    height: 32,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  activeDot: {
    backgroundColor: "white",
    width: 32,
    height: 12,
    borderRadius: 6,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  dotGlow: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  prevButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  finishButton: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderColor: "rgba(255, 255, 255, 0.5)",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  spacer: {
    flex: 1,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginHorizontal: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
