# AutoSynth Monorepo - Root Build Configuration
# =============================================
#
# This is the master build file for the AutoSynth plugin collection.
# It supports selective building of plugins by type or name.
#
# Usage:
#   cmake -B build                                    # Configure (no plugins)
#   cmake -B build -DBUILD_ALL=ON                     # All plugins
#   cmake -B build -DBUILD_SYNTHS=ON                  # All synths
#   cmake -B build -DBUILD_EFFECTS=ON                 # All effects
#   cmake -B build -DPLUGINS="ModelD;DFAM"            # Specific plugins
#   cmake --build build                               # Build configured plugins
#
cmake_minimum_required(VERSION 3.22)

project(AutoSynth
    VERSION 1.0.0
    DESCRIPTION "AutoSynth Plugin Collection"
    LANGUAGES CXX C
)

# Build options
option(BUILD_ALL "Build all plugins" OFF)
option(BUILD_SYNTHS "Build all synth plugins" OFF)
option(BUILD_EFFECTS "Build all effect plugins" OFF)
option(BUILD_MIDI "Build all MIDI plugins" OFF)
option(BUILD_TESTS "Build tests" ON)

# Specific plugins to build (semicolon-separated list)
set(PLUGINS "" CACHE STRING "Specific plugins to build (e.g., 'ModelD;DFAM')")

# ============================================================================
# Global Settings
# ============================================================================

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Shared output directory for all plugins
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)

# ============================================================================
# JUCE
# ============================================================================

# Try Docker cached JUCE first, then local
if(EXISTS "/opt/JUCE")
    set(JUCE_PATH "/opt/JUCE")
    message(STATUS "Using Docker-cached JUCE")
elseif(EXISTS "${CMAKE_SOURCE_DIR}/libs/JUCE")
    set(JUCE_PATH "${CMAKE_SOURCE_DIR}/libs/JUCE")
    message(STATUS "Using local JUCE submodule")
else()
    message(WARNING "JUCE not found. Run: git submodule add https://github.com/juce-framework/JUCE.git libs/JUCE")
endif()

if(JUCE_PATH)
    add_subdirectory(${JUCE_PATH} juce EXCLUDE_FROM_ALL)
endif()

# ============================================================================
# SST Libraries (shared across all plugins)
# ============================================================================

# Try Docker cached SST first, then local
if(EXISTS "/opt/sst")
    set(SST_PATH "/opt/sst")
    message(STATUS "Using Docker-cached SST libraries")
else()
    set(SST_PATH "${CMAKE_SOURCE_DIR}/libs")
    message(STATUS "Using local SST submodules")
endif()

# Add SST libraries if available
if(EXISTS "${SST_PATH}/sst-basic-blocks")
    add_subdirectory(${SST_PATH}/sst-basic-blocks sst-basic-blocks EXCLUDE_FROM_ALL)
endif()
if(EXISTS "${SST_PATH}/sst-filters")
    add_subdirectory(${SST_PATH}/sst-filters sst-filters EXCLUDE_FROM_ALL)
endif()
if(EXISTS "${SST_PATH}/sst-effects")
    add_subdirectory(${SST_PATH}/sst-effects sst-effects EXCLUDE_FROM_ALL)
endif()
if(EXISTS "${SST_PATH}/sst-waveshapers")
    add_subdirectory(${SST_PATH}/sst-waveshapers sst-waveshapers EXCLUDE_FROM_ALL)
endif()

# ============================================================================
# Core Library (shared DSP and utilities)
# ============================================================================

# TODO: Add core library when we have shared DSP code
# add_subdirectory(core/dsp)
# add_subdirectory(core/effects)

# ============================================================================
# Plugin Discovery and Building
# ============================================================================

# Function to add a plugin subdirectory
function(add_plugin_if_requested PLUGIN_PATH PLUGIN_NAME PLUGIN_TYPE)
    set(SHOULD_BUILD FALSE)

    # Check if this plugin should be built
    if(BUILD_ALL)
        set(SHOULD_BUILD TRUE)
    elseif(BUILD_SYNTHS AND PLUGIN_TYPE STREQUAL "synth")
        set(SHOULD_BUILD TRUE)
    elseif(BUILD_EFFECTS AND PLUGIN_TYPE STREQUAL "effect")
        set(SHOULD_BUILD TRUE)
    elseif(BUILD_MIDI AND PLUGIN_TYPE STREQUAL "midi")
        set(SHOULD_BUILD TRUE)
    elseif(PLUGINS)
        # Check if plugin name is in the PLUGINS list
        string(REPLACE ";" "|" PLUGINS_REGEX "${PLUGINS}")
        if(PLUGIN_NAME MATCHES "^(${PLUGINS_REGEX})$")
            set(SHOULD_BUILD TRUE)
        endif()
    endif()

    if(SHOULD_BUILD)
        message(STATUS "Building ${PLUGIN_TYPE}: ${PLUGIN_NAME}")
        add_subdirectory(${PLUGIN_PATH})
    else()
        message(STATUS "Skipping ${PLUGIN_TYPE}: ${PLUGIN_NAME}")
    endif()
endfunction()

# ============================================================================
# Synth Plugins
# ============================================================================

file(GLOB SYNTH_DIRS RELATIVE ${CMAKE_SOURCE_DIR}/plugins/synths
     ${CMAKE_SOURCE_DIR}/plugins/synths/*)

foreach(SYNTH_DIR ${SYNTH_DIRS})
    if(IS_DIRECTORY ${CMAKE_SOURCE_DIR}/plugins/synths/${SYNTH_DIR})
        if(EXISTS ${CMAKE_SOURCE_DIR}/plugins/synths/${SYNTH_DIR}/CMakeLists.txt)
            add_plugin_if_requested(
                plugins/synths/${SYNTH_DIR}
                ${SYNTH_DIR}
                "synth"
            )
        endif()
    endif()
endforeach()

# ============================================================================
# Effect Plugins
# ============================================================================

file(GLOB EFFECT_DIRS RELATIVE ${CMAKE_SOURCE_DIR}/plugins/effects
     ${CMAKE_SOURCE_DIR}/plugins/effects/*)

foreach(EFFECT_DIR ${EFFECT_DIRS})
    if(IS_DIRECTORY ${CMAKE_SOURCE_DIR}/plugins/effects/${EFFECT_DIR})
        if(EXISTS ${CMAKE_SOURCE_DIR}/plugins/effects/${EFFECT_DIR}/CMakeLists.txt)
            add_plugin_if_requested(
                plugins/effects/${EFFECT_DIR}
                ${EFFECT_DIR}
                "effect"
            )
        endif()
    endif()
endforeach()

# ============================================================================
# MIDI Plugins
# ============================================================================

file(GLOB MIDI_DIRS RELATIVE ${CMAKE_SOURCE_DIR}/plugins/midi
     ${CMAKE_SOURCE_DIR}/plugins/midi/*)

foreach(MIDI_DIR ${MIDI_DIRS})
    if(IS_DIRECTORY ${CMAKE_SOURCE_DIR}/plugins/midi/${MIDI_DIR})
        if(EXISTS ${CMAKE_SOURCE_DIR}/plugins/midi/${MIDI_DIR}/CMakeLists.txt)
            add_plugin_if_requested(
                plugins/midi/${MIDI_DIR}
                ${MIDI_DIR}
                "midi"
            )
        endif()
    endif()
endforeach()

# ============================================================================
# Summary
# ============================================================================

message(STATUS "")
message(STATUS "AutoSynth Configuration:")
message(STATUS "  BUILD_ALL:     ${BUILD_ALL}")
message(STATUS "  BUILD_SYNTHS:  ${BUILD_SYNTHS}")
message(STATUS "  BUILD_EFFECTS: ${BUILD_EFFECTS}")
message(STATUS "  BUILD_MIDI:    ${BUILD_MIDI}")
message(STATUS "  PLUGINS:       ${PLUGINS}")
message(STATUS "")
