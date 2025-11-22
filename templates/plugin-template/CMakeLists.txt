cmake_minimum_required(VERSION 3.22)

# ============================================================================
# PROJECT CONFIGURATION
# TODO: Update these values for your plugin
# ============================================================================
project(MyPlugin VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Plugin identification
# TODO: Update these for your plugin
set(PLUGIN_NAME "MyPlugin")
set(PLUGIN_CODE "MyPl")  # 4-character unique code
set(COMPANY_NAME "Studio")
set(COMPANY_CODE "Stud")

# ============================================================================
# OPTIONS
# ============================================================================
option(BUILD_TESTS "Build unit tests" ON)
option(COPY_PLUGIN_AFTER_BUILD "Copy plugin to system location" TRUE)

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
juce_add_plugin(${PROJECT_NAME}
    VERSION ${PROJECT_VERSION}
    COMPANY_NAME "${COMPANY_NAME}"
    COMPANY_COPYRIGHT "Copyright 2024 ${COMPANY_NAME}"
    COMPANY_WEBSITE "https://example.com"
    PLUGIN_MANUFACTURER_CODE ${COMPANY_CODE}
    PLUGIN_CODE ${PLUGIN_CODE}
    FORMATS VST3 AU Standalone
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
    # TODO: Add your DSP files here
    # source/dsp/Voice.cpp
)

# ============================================================================
# INCLUDE DIRECTORIES
# ============================================================================
target_include_directories(${PROJECT_NAME} PRIVATE
    ${CMAKE_SOURCE_DIR}/source
    ${CMAKE_SOURCE_DIR}/source/dsp
)

# ============================================================================
# LINK LIBRARIES
# ============================================================================
target_link_libraries(${PROJECT_NAME}
    PRIVATE
        sst-libraries
        juce::juce_audio_utils
        juce::juce_dsp
        juce::juce_gui_extra  # For WebView
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags
)

# ============================================================================
# COMPILE DEFINITIONS
# ============================================================================
target_compile_definitions(${PROJECT_NAME}
    PUBLIC
        JUCE_WEB_BROWSER=1
        JUCE_USE_CURL=0
        JUCE_VST3_CAN_REPLACE_VST2=0
        JUCE_DISPLAY_SPLASH_SCREEN=0
)

# ============================================================================
# EMBED UI RESOURCES
# Build the UI first: cd ui && npm run build
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
