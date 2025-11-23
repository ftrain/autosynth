cmake_minimum_required(VERSION 3.22)

# ============================================================================
# PROJECT CONFIGURATION
# ============================================================================
project(PhoneTones VERSION 1.0.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Plugin identification
set(PLUGIN_NAME "PhoneTones")
set(PLUGIN_CODE "PhTn")
set(COMPANY_NAME "Studio")
set(COMPANY_CODE "Stud")

# ============================================================================
# OPTIONS
# ============================================================================
option(BUILD_TESTS "Build unit tests" ON)
option(COPY_PLUGIN_AFTER_BUILD "Copy plugin to system location" TRUE)

# ============================================================================
# LINUX DEPENDENCIES (optional - WebView requires GTK3 and WebKit)
# ============================================================================
set(HAS_LINUX_WEBVIEW OFF)
set(HAS_ALSA OFF)
if(UNIX AND NOT APPLE)
    find_package(PkgConfig QUIET)
    if(PkgConfig_FOUND)
        pkg_check_modules(GTK3 QUIET gtk+-3.0)
        pkg_check_modules(WEBKIT2GTK QUIET webkit2gtk-4.1)
        pkg_check_modules(ALSA QUIET alsa)
        if(GTK3_FOUND AND WEBKIT2GTK_FOUND)
            set(HAS_LINUX_WEBVIEW ON)
            message(STATUS "GTK3 and WebKit2GTK found - WebView enabled")
        else()
            message(WARNING "GTK3 or WebKit2GTK not found - WebView disabled")
        endif()
        if(ALSA_FOUND)
            set(HAS_ALSA ON)
            message(STATUS "ALSA found - Standalone enabled")
        else()
            message(WARNING "ALSA not found - Standalone disabled on Linux")
        endif()
    endif()
endif()

# ============================================================================
# JUCE
# ============================================================================
add_subdirectory(JUCE)

# ============================================================================
# SST LIBRARIES (header-only)
# ============================================================================
add_library(sst-libraries INTERFACE)
target_include_directories(sst-libraries INTERFACE
    ${CMAKE_SOURCE_DIR}/libs/sst/sst-basic-blocks/include
    ${CMAKE_SOURCE_DIR}/libs/sst/sst-filters/include
    ${CMAKE_SOURCE_DIR}/libs/sst/sst-effects/include
    ${CMAKE_SOURCE_DIR}/libs/sst/sst-waveshapers/include
)

# ============================================================================
# PLUGIN TARGET
# ============================================================================

# Determine plugin formats based on platform and available libraries
set(PLUGIN_FORMATS VST3)
if(APPLE)
    list(APPEND PLUGIN_FORMATS AU Standalone)
elseif(HAS_ALSA)
    list(APPEND PLUGIN_FORMATS Standalone)
endif()

juce_add_plugin(${PROJECT_NAME}
    VERSION ${PROJECT_VERSION}
    COMPANY_NAME "${COMPANY_NAME}"
    COMPANY_COPYRIGHT "Copyright 2024 ${COMPANY_NAME}"
    COMPANY_WEBSITE "https://example.com"
    PLUGIN_MANUFACTURER_CODE ${COMPANY_CODE}
    PLUGIN_CODE ${PLUGIN_CODE}
    FORMATS ${PLUGIN_FORMATS}
    PRODUCT_NAME "${PLUGIN_NAME}"
    IS_SYNTH TRUE
    NEEDS_MIDI_INPUT TRUE
    NEEDS_MIDI_OUTPUT FALSE
    EDITOR_WANTS_KEYBOARD_FOCUS TRUE
    COPY_PLUGIN_AFTER_BUILD ${COPY_PLUGIN_AFTER_BUILD}
)

# ============================================================================
# SOURCE FILES
# ============================================================================
target_sources(${PROJECT_NAME} PRIVATE
    source/PluginProcessor.cpp
    source/PluginEditor.cpp
)

# ============================================================================
# INCLUDE DIRECTORIES
# ============================================================================
target_include_directories(${PROJECT_NAME} PRIVATE
    ${CMAKE_SOURCE_DIR}/source
    ${CMAKE_SOURCE_DIR}/source/dsp
)

# Linux GTK/WebKit includes
if(HAS_LINUX_WEBVIEW)
    target_include_directories(${PROJECT_NAME} PRIVATE
        ${GTK3_INCLUDE_DIRS}
        ${WEBKIT2GTK_INCLUDE_DIRS}
    )
endif()

# ============================================================================
# LINK LIBRARIES
# ============================================================================
target_link_libraries(${PROJECT_NAME}
    PRIVATE
        sst-libraries
        juce::juce_audio_utils
        juce::juce_dsp
        juce::juce_gui_extra
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags
)

# ============================================================================
# COMPILE DEFINITIONS
# ============================================================================
if(HAS_LINUX_WEBVIEW OR NOT (UNIX AND NOT APPLE))
    set(ENABLE_WEB_BROWSER 1)
else()
    set(ENABLE_WEB_BROWSER 0)
endif()

target_compile_definitions(${PROJECT_NAME}
    PUBLIC
        JUCE_WEB_BROWSER=${ENABLE_WEB_BROWSER}
        JUCE_USE_CURL=0
        JUCE_VST3_CAN_REPLACE_VST2=0
        JUCE_DISPLAY_SPLASH_SCREEN=0
)

# ============================================================================
# EMBED UI RESOURCES
# ============================================================================
if(EXISTS "${CMAKE_SOURCE_DIR}/ui/dist/index.html")
    juce_add_binary_data(${PROJECT_NAME}_UIData
        HEADER_NAME UIResources.h
        NAMESPACE UIResources
        SOURCES
            ui/dist/index.html
    )
    target_link_libraries(${PROJECT_NAME} PRIVATE ${PROJECT_NAME}_UIData)
    target_compile_definitions(${PROJECT_NAME} PRIVATE HAS_UI_RESOURCES=1)
else()
    message(WARNING "UI not built. Run 'cd ui && npm install && npm run build' first.")
endif()

# ============================================================================
# TESTS
# ============================================================================
if(BUILD_TESTS)
    enable_testing()
    add_subdirectory(tests)
endif()

# ============================================================================
# INSTALLATION
# ============================================================================
install(TARGETS ${PROJECT_NAME}_VST3
    LIBRARY DESTINATION lib/vst3
    COMPONENT plugin
)

if(APPLE)
    install(TARGETS ${PROJECT_NAME}_AU
        LIBRARY DESTINATION "Library/Audio/Plug-Ins/Components"
        COMPONENT plugin
    )
endif()
